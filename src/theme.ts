import { createTheme } from '@mantine/core'

export const theme = createTheme({
  components: {
    SegmentedControl: {
      styles: {
        root: { backgroundColor: 'var(--mantine-color-white)' },
      },
    },
  },
})
