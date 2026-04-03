# Skill: The Empathetic Authority (Design System)

## Overview
This design system focuses on **Empathetic Authority** for public service applications. It moves away from cold, industrial aesthetics toward a "Guided Journey" experience using intentional asymmetry and tonal layering.

## Creative North Star
"The Guided Journey" — reducing citizen anxiety through stability and human-centric design.

## Core Rules

### 1. The "No-Line" Rule
**Prohibited:** 1px solid borders for section definition.
**Required:** Boundaries created via background shifts (Tonal Layering) or subtle transitions.

### 2. Surface Hierarchy (Tonal Layering)
- **Base:** `surface` (#f7f9fb)
- **Sections:** `surface-container-low` (#f2f4f6)
- **Cards:** `surface-container-lowest` (#ffffff)
- **Active Overlays:** `surface-bright` (#f7f9fb)

### 3. Glass & Gradient Rule
- **Calling Alerts:** Use Glassmorphism (`backdrop-filter: blur(20px)`).
- **Hero Buttons:** Subtle linear gradient from `#00346f` to `#004a99`.

### 4. Typography
- **Public Sans**: Authoritative (Ticket Numbers, 56px).
- **Inter**: Data-dense (Dashboards, 12px-28px).

### 5. Elevation
- Avoid traditional drop shadows.
- Use **Ambient Shadows**: 24px blur, 4% opacity, tinted with `primary` color.

## Do's and Don'ts

### Do:
- Use White Space as a grouping tool.
- Layer Surface Tones for hierarchy.
- Ensure 10-meter readability for public displays.

### Don't:
- Don't use 1px black borders.
- Don't use standard black drop shadows.
- Don't crowd the Kiosk interface.
