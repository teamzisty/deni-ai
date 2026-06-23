import type { ReactDoctorConfig } from "react-doctor/api";

export default {
  lint: true,
  deadCode: true,
  ignore: {
    files: ["public/**", "tools/**", "src/components/ai-elements/**", "src/components/ui/**"],
  },
} satisfies ReactDoctorConfig;
