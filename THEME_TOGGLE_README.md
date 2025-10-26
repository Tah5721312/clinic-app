# Dark/Light Theme Toggle Implementation

This implementation provides a Material-UI style toggle switch using Tailwind CSS for switching between dark and light themes.

## Features

- ✅ Material-UI style toggle switch with sun/moon icons
- ✅ Persistent theme storage in localStorage
- ✅ System preference detection
- ✅ Smooth transitions and animations
- ✅ Accessible with proper ARIA labels
- ✅ Mobile responsive design
- ✅ TypeScript support

## Files Created/Modified

### New Files:

- `src/contexts/ThemeContext.tsx` - Theme context and provider
- `src/components/ThemeToggle.tsx` - Toggle switch component
- `src/components/ThemeDemo.tsx` - Demo component showing theme usage

### Modified Files:

- `src/components/Providers.tsx` - Added ThemeProvider
- `src/app/layout.tsx` - Added dark mode classes to body
- `src/components/Navigation.tsx` - Added toggle to navigation (desktop & mobile)
- `src/styles/globals.css` - Added dark mode configuration

## Usage

### Basic Usage

The toggle is automatically available in the navigation bar. Users can click it to switch between light and dark themes.

### Using the Theme Context

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div className='bg-white dark:bg-gray-900 text-gray-900 dark:text-white'>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Styling with Dark Mode

Use Tailwind's `dark:` prefix to apply styles in dark mode:

```tsx
<div className='bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
  <h1 className='text-2xl font-bold'>Title</h1>
  <p className='text-gray-600 dark:text-gray-300'>Description</p>
</div>
```

## Theme Toggle Component

The `ThemeToggle` component is a self-contained toggle switch that:

- Shows a sun icon in light mode, moon icon in dark mode
- Smoothly animates between states
- Uses the same colors as the Material-UI example
- Is fully accessible with proper ARIA labels

### Customization

You can customize the toggle by modifying the colors in `ThemeToggle.tsx`:

```tsx
// Light mode track color
backgroundColor: theme === 'dark' ? '#8796A5' : '#aab4be';

// Thumb colors
backgroundColor: theme === 'dark' ? '#003892' : '#001e3c';
```

## Theme Context API

### `useTheme()` Hook

Returns an object with:

- `theme: 'light' | 'dark'` - Current theme
- `toggleTheme: () => void` - Toggle between themes
- `setTheme: (theme: 'light' | 'dark') => void` - Set specific theme

### ThemeProvider

Wraps your app to provide theme context. Automatically:

- Loads saved theme from localStorage
- Falls back to system preference
- Applies theme to document root
- Prevents hydration mismatches

## Storage

The theme preference is stored in localStorage with the key `'currentMode'` and values `'light'` or `'dark'`.

## Browser Support

- Modern browsers with CSS custom properties support
- localStorage support
- CSS transitions support

## Accessibility

- Proper ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors
- Focus indicators

## Performance

- No flash of unstyled content (FOUC)
- Smooth 200ms transitions
- Minimal JavaScript overhead
- CSS-only animations where possible
