import _ from "lodash";
import { DateTime } from "luxon";
import useLocalStorage from "use-local-storage";
import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getStartOffset() {
  const offsetMs = DateTime.utc().millisecond;
  if (offsetMs < 500) return 500 - offsetMs;
  return 1500 - offsetMs;
}

export function useDeltaTimeNow(targetDate: DateTime) {
  const [deltaTime, setDeltaTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const ids: NodeJS.Timeout[] = [];

    async function deltaUpdate() {
      const timeDiff = targetDate.diffNow([
        "days",
        "hours",
        "minutes",
        "second",
      ]);
      setDeltaTime({
        days: ~~Math.abs(timeDiff.days),
        hours: ~~Math.abs(timeDiff.hours),
        minutes: ~~Math.abs(timeDiff.minutes),
        seconds: ~~Math.abs(timeDiff.seconds),
      });
    }

    deltaUpdate();
    ids.push(
      setTimeout(() => {
        ids.push(setInterval(deltaUpdate, 1000));
      }, getStartOffset())
    );

    return () => {
      for (const id of ids) {
        clearInterval(id);
      }
    };
  }, [targetDate]);

  return deltaTime;
}

export interface FormData {
  endDate: DateTime;
  digits: string[];
  title: string;
  imageId: string;
}

function deserialize<K extends keyof FormData>(
  searchParams: URLSearchParams,
  key: K
): FormData[K] {
  const value = searchParams.get(key);
  if (key === "endDate")
    return (value ? DateTime.fromISO(value) : DateTime.now()) as FormData[K];
  if (key === "digits")
    return (value ? value?.split(",") : ["d", "h", "m", "s"]) as FormData[K];
  if (key === "title") return (value ? value : "") as FormData[K];
  if (key === "imageId") return (value ? value : "") as FormData[K];
  throw new Error(`this key (${key}) is not supported on FormData`);
}

function serialize<K extends keyof FormData>(
  key: K,
  value: FormData[K]
): string {
  if (key === "endDate")
    return (
      (value as DateTime).toISO({
        format: "basic",
        suppressMilliseconds: true,
      }) ?? new Date().toISOString()
    );
  if (key === "digits") return (value as string[]).join(",");
  if (key === "title") return value as string;
  if (key === "imageId") return value as string;
  throw new Error(`this key (${key}) is not supported on FormData`);
}

export function useFormData() {
  const [searchParams, setSearchParams] = useSearchParams();

  const generateNewParams = useCallback(
    (values: Partial<FormData>) => {
      const temp = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(values)) {
        // @ts-ignore
        const serializedValue = serialize(key, value);
        temp.delete(key);
        if (serializedValue) temp.append(key, serializedValue);
      }
      return temp;
    },
    [searchParams]
  );

  const setData = useCallback(
    (values: Partial<FormData>) => {
      setSearchParams(generateNewParams(values));
    },
    [generateNewParams, setSearchParams]
  );

  const data = useMemo<FormData>(
    () => ({
      endDate: deserialize(searchParams, "endDate"),
      digits: deserialize(searchParams, "digits"),
      title: deserialize(searchParams, "title"),
      imageId: deserialize(searchParams, "imageId"),
    }),
    [searchParams]
  );

  return {
    data,
    setData,
    searchParams,
    setSearchParams,
    generateNewParams,
  };
}

export function usePrev<T>(state: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = state;
  });
  return ref.current;
}

export interface HistoryItem {
  date: DateTime;
  title: string;
  searchParams: string;
}

export const options = {
  serializer: (list: HistoryItem[] | undefined) => {
    if (list) {
      const _list = _.cloneDeep<any>(list);
      for (const item of _list) {
        if (item.date instanceof DateTime) item.date = item.date.toISO();
      }
      return JSON.stringify(_list);
    }
    return JSON.stringify([]);
  },
  parser: (str: string) => {
    try {
      const list = JSON.parse(str);
      for (const item of list) {
        item.date = DateTime.fromISO(item.date);
      }
      return list as HistoryItem[];
    } catch (e) {
      return [];
    }
  },
};

const MAX_HISTORY_LEN = 5;

export function usePresetHistory() {
  const { data, searchParams } = useFormData();
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(
    "history",
    [],
    options
  );
  const prevSearchParams = usePrev(searchParams);

  useEffect(() => {
    if (searchParams !== prevSearchParams && data.title) {
      setHistory((oldHistory) => {
        const newHistory = _.cloneDeep(oldHistory ?? [])
          .sort((a, b) => {
            if (a.date > b.date) return -1;
            else if (a.date < b.date) return 1;
            else return 0;
          })
          .slice(0, MAX_HISTORY_LEN);
        const existingItem = newHistory.find(
          (item) => item.title === data.title
        );

        if (existingItem) {
          existingItem.date = DateTime.now();
          existingItem.title = data.title;
          existingItem.searchParams = searchParams.toString();
        } else {
          if (newHistory.length >= MAX_HISTORY_LEN) newHistory.splice(-1, 1);
          newHistory.push({
            date: DateTime.now(),
            title: data.title,
            searchParams: searchParams.toString(),
          });
        }
        return newHistory;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return [history, setHistory] as const;
}
