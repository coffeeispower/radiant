import { Schema } from "effect";
import { Ref, RefObject, useLayoutEffect, useRef, useState } from "react";
const InternalElementSizeState = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  pass: Schema.Literal(1, 2),
});

const equalsInternalElementSize = Schema.equivalence(InternalElementSizeState);
type InternalElementSizeState = Schema.Schema.Type<typeof InternalElementSizeState>;



export type ElementSize<T extends HTMLElement> = InternalElementSizeState & {
	ref: RefObject<T | null>;
};
export type DivElementSize = ElementSize<HTMLDivElement>;
export function useElementSize<T extends HTMLElement>(): ElementSize<T> {
  const ref = useRef<T>(null);

  const [size, setSize] = useState(InternalElementSizeState.make({
    width: 0,
    height: 0,
		pass: 1
  }));

  useLayoutEffect(() => {
    const element = ref.current;

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

    // Mede logo na montagem
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref.current]);

  return {
    ref,
    ...size,
  };
}
