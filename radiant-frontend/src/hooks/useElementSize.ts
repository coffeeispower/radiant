import { Schema } from "effect";
import { RefObject, useCallback, useLayoutEffect, useRef, useState } from "react";
const InternalElementSizeState = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  pass: Schema.Literal(1, 2),
});

const equalsInternalElementSize = Schema.equivalence(InternalElementSizeState);
type InternalElementSizeState = Schema.Schema.Type<typeof InternalElementSizeState>;

export type ElementSize<T extends HTMLElement> = InternalElementSizeState & {
	ref: RefObject<T | null>;
	setElement: (el: T | null) => void;
};
export type DivElementSize = ElementSize<HTMLDivElement>;
export function useElementSize<T extends HTMLElement>(): ElementSize<T> {
  const [element, setElementState] = useState<T | null>(null);
  const ref = useRef<T | null>(null);

  const setElement = useCallback((el: T | null) => {
    ref.current = el;
    setElementState(el);
  }, []);

  const [size, setSize] = useState(InternalElementSizeState.make({
    width: 0,
    height: 0,
		pass: 1
  }));

  useLayoutEffect(() => {
    if (!element) {
      return;
    }

    const update = () => {
			let newSize = InternalElementSizeState.make({
        width: element.clientWidth,
        height: element.clientHeight,
				pass: 2
      });
      setSize((previous) => {
				if(equalsInternalElementSize(newSize, previous)) return previous;
				else return newSize;
			});
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return {
    ref,
    setElement,
    ...size,
  };
}
