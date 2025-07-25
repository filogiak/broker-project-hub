
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					dark: 'hsl(var(--primary-dark))',
					darker: 'hsl(var(--primary-darker))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					yellow: '#D3F54F', /* Updated to new yellow */
					'yellow-alt': '#C5E849' /* Darker version for hover */
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// GoMutuo.it Extended Colors - Updated with new green #235c4e
				form: {
					green: '#235c4e', /* Direct hex value for consistency */
					'green-hover': '#1e4f43', /* Darker for hover */
					'green-active': '#194238', /* Even darker for active */
					beige: 'hsl(var(--form-beige))',
					placeholder: 'hsl(var(--form-placeholder))',
					border: 'hsl(var(--form-border))',
					shadow: 'hsl(var(--form-shadow))'
				},
				vibe: {
					green: 'hsl(var(--vibe-green))',
					'green-vivid': 'hsl(var(--vibe-green-vivid))',
					'green-light': 'hsl(var(--vibe-green-light))',
					'yellow-fluo': '#D3F54F' /* Updated to new yellow */
				},
				'background-cream': 'hsl(var(--background-cream))',
				'background-light': 'hsl(var(--background-light))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
				inter: ['Inter', 'system-ui', 'sans-serif'],
				'dm-sans': ['DM Sans', 'system-ui', 'sans-serif']
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'expand-line': {
					'0%': { transform: 'scaleX(0)' },
					'100%': { transform: 'scaleX(1)' }
				},
				'shine': {
					'0%': { 'background-position': '0% center' },
					'100%': { 'background-position': '200% center' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'expand-line': 'expand-line 0.3s ease-out',
				'shine': 'shine 3s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
