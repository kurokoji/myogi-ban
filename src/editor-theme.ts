import { createTheme, NumberInput } from "@mantine/core";
import {
  NUMBER_INPUT_STEP_HOLD_DELAY_MS,
  NUMBER_INPUT_STEP_HOLD_INTERVAL_MS,
} from "./app-constants";

export const editorTheme = createTheme({
  fontFamily: "var(--app-font-family)",
  fontFamilyMonospace: "var(--app-font-family-monospace)",
  headings: {
    fontFamily: "var(--app-font-family)",
  },
  components: {
    NumberInput: NumberInput.extend({
      defaultProps: {
        stepHoldDelay: NUMBER_INPUT_STEP_HOLD_DELAY_MS,
        stepHoldInterval: NUMBER_INPUT_STEP_HOLD_INTERVAL_MS,
      },
    }),
  },
});
