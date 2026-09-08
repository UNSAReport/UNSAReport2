import { Slide } from "@revealjs/react";
import { PresentationDeck } from "@/shared/presentation-deck";
import { SlideWrap } from "@/shared/slide-wrap";

export function MicrophotoPresentation() {
  return (
    <PresentationDeck config={{ slideNumber: "c/t", transition: "slide" }}>
      <Slide>
        <SlideWrap>
          <h1>Microphoto</h1>
          <p>Exploring the world of microphotography</p>
        </SlideWrap>
      </Slide>
    </PresentationDeck>
  );
}
