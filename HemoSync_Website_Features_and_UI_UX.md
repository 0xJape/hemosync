# HemoSync Website Features and UI/UX

## 1. Document Purpose

This document defines the complete user interface and user experience requirements for the HemoSync web application.

The platform is designed as a two-page web application for healthcare workers, screening-station operators, and authorized medical personnel. Its interface must support real-time patient screening, physiological measurement review, AI-assisted analysis, patient record management, report generation, and email or SMS delivery.

The website must remain reliable, responsive, readable, and visually consistent across desktop computers, laptops, tablets, and mobile devices.

The user interface should feel modern and futuristic while maintaining the clarity, calmness, and professionalism expected from a healthcare screening platform.

---

# 2. UI/UX Objectives

The HemoSync interface must achieve the following goals:

* Present physiological measurements clearly and accurately.
* Minimize the number of steps required to complete a screening.
* Provide immediate visual feedback for every user action.
* Maintain a spacious and uncluttered layout.
* Support real-time updates from the HemoSync testing device.
* Display AI-assisted summaries without overwhelming the user.
* Provide clear loading, success, warning, and error states.
* Remain fully responsive at all supported screen sizes.
* Prevent accidental loss of patient or measurement data.
* Maintain a consistent visual identity throughout the application.
* Ensure that users can understand the current system state at all times.
* Avoid dead ends, broken layouts, empty screens, and unexplained errors.

---

# 3. Design Direction

## 3.1 Visual Style

The HemoSync website should use a futuristic medical interface inspired by modern healthcare systems, command-center dashboards, and premium technology products.

The design should feel:

* Clean
* Precise
* Professional
* Calm
* Intelligent
* Advanced
* Trustworthy
* Spacious

The interface should avoid:

* Excessive visual clutter
* Too many colors
* Overly aggressive glowing effects
* Small text
* Dense tables
* Unnecessary decorations
* Flashing animations
* Distracting background movement
* Overuse of glassmorphism
* Excessive gradients
* Complex navigation

The futuristic identity should come from controlled motion, layered cards, depth, live-status indicators, subtle 3D elements, and intelligent transitions rather than excessive neon effects.

---

## 3.2 Typography

The primary font family should be:

```css
font-family: "Poppins", sans-serif;
```

Poppins should be applied consistently across the entire website.

### Recommended Font Weights

* 300 — Supporting text
* 400 — Normal body text
* 500 — Labels and navigation
* 600 — Card titles and buttons
* 700 — Main values and page headings

### Suggested Typography Scale

| Element           |  Desktop |   Tablet |   Mobile |
| ----------------- | -------: | -------: | -------: |
| Main page title   | 32–40 px | 30–36 px | 26–32 px |
| Section heading   | 24–28 px | 22–26 px | 20–24 px |
| Card heading      | 17–20 px | 17–19 px | 16–18 px |
| Measurement value | 48–72 px | 44–64 px | 38–52 px |
| Body text         | 15–17 px | 15–16 px | 14–16 px |
| Supporting text   | 13–14 px | 13–14 px | 12–14 px |
| Button text       | 14–16 px | 14–16 px | 14–15 px |

Line heights should remain generous to improve readability.

Recommended body line height:

```css
line-height: 1.6;
```

---

# 4. Color System

## 4.1 Core Palette

| Purpose             | Color     |
| ------------------- | --------- |
| Primary Red         | `#C1121F` |
| Deep Red            | `#780000` |
| Accent Red          | `#E63946` |
| Soft Red            | `#FDECEF` |
| Main Background     | `#FAFAFA` |
| Surface             | `#FFFFFF` |
| Primary Text        | `#1F2937` |
| Secondary Text      | `#6B7280` |
| Border              | `#E5E7EB` |
| Disabled Background | `#F3F4F6` |
| Disabled Text       | `#9CA3AF` |

## 4.2 Status Colors

| State       | Suggested Color |
| ----------- | --------------- |
| Success     | `#16A34A`       |
| Warning     | `#F59E0B`       |
| Error       | `#DC2626`       |
| Information | `#2563EB`       |
| Offline     | `#6B7280`       |
| Processing  | `#7C3AED`       |

Status colors must not be communicated through color alone. Every state should also include an icon, label, or explanatory message.

---

# 5. Layout System

## 5.1 General Layout Rules

The interface should use a modular card-based layout.

Each page should include:

* A consistent page container
* Predictable spacing
* Clear section grouping
* Responsive grid behavior
* Adequate whitespace
* Consistent card heights where possible
* Stable placement of important actions

Recommended maximum content width:

```css
max-width: 1600px;
```

Recommended horizontal padding:

| Screen Size      | Horizontal Padding |
| ---------------- | -----------------: |
| Large desktop    |           40–64 px |
| Standard desktop |           32–40 px |
| Tablet           |           24–32 px |
| Mobile           |           16–20 px |

Recommended vertical spacing between major sections:

```css
24px to 40px
```

Recommended card padding:

```css
20px to 32px
```

---

## 5.2 Grid System

Desktop layouts may use a 12-column grid.

Suggested behavior:

* Large desktop: 12 columns
* Standard desktop: 12 columns
* Tablet: 6 or 8 columns
* Mobile: 1 column

Cards should automatically move below one another when screen width becomes limited.

The layout should never rely on fixed-width components that cause horizontal scrolling.

---

# 6. Responsive Design Requirements

The entire website must be responsive, not only selected sections.

Responsiveness must apply to:

* Navigation
* Cards
* Charts
* Tables
* Forms
* Buttons
* Modals
* Side panels
* Loading states
* AI summaries
* Error messages
* 3D elements
* Device status indicators
* Patient information
* Measurement values
* Report previews

## 6.1 Recommended Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## 6.2 Desktop Behavior

Desktop layout should support:

* Multi-column cards
* Fixed or sticky top navigation
* Side-by-side heart-rate and SpO₂ panels
* Expanded AI insight panel
* Larger charts
* Persistent patient context
* Visible secondary actions

## 6.3 Tablet Behavior

Tablet layout should:

* Reduce grid columns
* Stack secondary cards
* Maintain readable chart sizes
* Use collapsible sections where appropriate
* Keep primary actions visible
* Avoid overly narrow cards
* Support both portrait and landscape orientations

## 6.4 Mobile Behavior

Mobile layout should:

* Use a single-column structure
* Stack all major cards vertically
* Convert wide tables into cards or scrollable lists
* Use full-width primary buttons
* Reduce decorative animations
* Simplify 3D content
* Keep main measurements visible without zooming
* Use bottom sheets or full-screen dialogs instead of wide modals
* Maintain at least 44-pixel touch targets
* Avoid horizontal overflow

---

# 7. Navigation

## 7.1 Top Navigation

The top navigation should remain consistent across both pages.

### Contents

* HemoSync logo
* Current page title
* Device connection status
* Notification indicator
* User profile menu
* Logout option

### Desktop

The navigation may display all items horizontally.

### Mobile

The navigation should collapse secondary items into a menu or drawer.

The device status should remain visible because it directly affects the screening workflow.

---

## 7.2 Page Navigation

The two primary pages are:

1. Screening Dashboard
2. Patient Records

Navigation should remain simple and obvious.

The active page should be visually highlighted using:

* Accent color
* Underline
* Filled pill
* Active icon state

Users should reach either main page with one interaction.

---

# 8. Page 1 — Screening Dashboard

## 8.1 Purpose

The Screening Dashboard is the primary workspace for conducting patient screenings.

It should allow healthcare workers to:

* Select or register a patient
* Confirm device readiness
* Start a screening
* Monitor measurement progress
* Review heart rate and SpO₂
* View AI-assisted interpretation
* Send reports
* Handle errors
* Repeat failed or invalid measurements

---

## 8.2 Dashboard Layout

Recommended desktop layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Navigation                                              │
├─────────────────────────────────────────────────────────────┤
│ Current Patient                  Device Status              │
├──────────────────────────┬──────────────────────────────────┤
│ Heart Rate               │ SpO₂                             │
├──────────────────────────┴──────────────────────────────────┤
│ Measurement Progress and Sensor Visualization               │
├─────────────────────────────────────────────────────────────┤
│ AI Screening Summary                                       │
├────────────────────────────┬────────────────────────────────┤
│ Email and SMS Actions      │ Recent Activity                │
└────────────────────────────┴────────────────────────────────┘
```

Mobile layout:

```text
Top Navigation
Current Patient
Device Status
Heart Rate
SpO₂
Measurement Progress
AI Screening Summary
Report Actions
Recent Activity
```

---

## 8.3 Current Patient Card

The current patient card should display:

* Patient name
* Patient ID
* Age
* Sex
* Email
* Mobile number
* Last screening date
* Edit patient button
* Change patient button

The card should clearly indicate when no patient is selected.

### Empty State

```text
No patient selected

Select an existing patient or register a new patient before starting the screening.
```

Primary actions:

* Select Patient
* Register Patient

The Start Screening button must remain disabled until a valid patient is selected.

---

## 8.4 Device Status Card

The device status card should display:

* Device name
* Station identifier
* Connection status
* Sensor status
* Wi-Fi status
* Last communication time
* Firmware version
* Battery status, if available

### Device States

* Ready
* Measuring
* Processing
* Uploading
* Offline
* Sensor Error
* Connection Lost
* Maintenance Required

Each state should include:

* Status icon
* Status color
* Clear text label
* Recommended action where necessary

Example:

```text
Device Offline

The screening station is not responding. Check the power supply, Wi-Fi connection, and backend connection.
```

Actions:

* Retry Connection
* View Troubleshooting
* Use Manual Entry, if supported

---

## 8.5 Live Heart Rate Card

The heart-rate card should display:

* Heart-rate value
* Unit: BPM
* Validity status
* Signal quality
* Measurement animation
* Previous measurement comparison
* Timestamp

Example:

```text
78 BPM
Stable reading
High signal quality
```

The value should be large and readable.

When no value is available, display:

```text
— BPM
Waiting for measurement
```

Do not display zero as a valid measurement.

---

## 8.6 Live SpO₂ Card

The SpO₂ card should display:

* Oxygen saturation value
* Unit: %
* Validity status
* Signal quality
* Previous measurement comparison
* Timestamp

Example:

```text
97%
Valid reading
High signal quality
```

When no value is available:

```text
— %
Waiting for measurement
```

---

## 8.7 Measurement Progress Section

The measurement progress component should visually explain what is currently happening.

### Measurement Stages

1. Preparing device
2. Waiting for finger placement
3. Collecting signal
4. Calculating readings
5. Validating measurement
6. Uploading data
7. Generating AI summary
8. Completed

The active stage should be clearly highlighted.

### Suggested Visual Elements

* Circular progress ring
* Horizontal progress timeline
* Pulse-wave animation
* Sensor scanning animation
* Subtle red glow
* Animated status label

Animations should remain calm and smooth.

The progress state must also be displayed as text so the user does not depend entirely on animation.

---

# 9. Loading States and Animations

Loading states must be implemented for every asynchronous action.

This includes:

* Initial page loading
* Patient search
* Patient registration
* Device connection
* Screening preparation
* Measurement processing
* Data upload
* AI generation
* Report creation
* Email delivery
* SMS delivery
* Chart loading
* Record retrieval
* Pagination
* Report download

## 9.1 Skeleton Loading

Skeleton placeholders should be used for:

* Patient cards
* Measurement cards
* Recent records
* AI summary sections
* Charts
* Tables

Skeletons should resemble the final layout to reduce layout shifting.

## 9.2 Button Loading

When an action is processing:

* Disable the button
* Show a spinner
* Change the label

Example:

```text
Generating Report...
```

Avoid allowing duplicate submissions.

## 9.3 Full-Screen Loading

A full-screen loader should only be used when the entire application cannot function until loading is complete.

Suggested loader:

* HemoSync logo
* Animated pulse line
* Short status text
* Subtle background gradient

## 9.4 AI Loading Animation

The AI summary area may display:

```text
Analyzing validated measurements...
Comparing recent screening patterns...
Preparing patient-friendly summary...
```

Use a typing or streaming effect, but allow the final text to remain stable once complete.

## 9.5 Motion Accessibility

Users who enable reduced-motion settings should receive simplified animations.

Use:

```css
@media (prefers-reduced-motion: reduce)
```

Disable or shorten:

* Parallax
* 3D movement
* Auto-rotating objects
* Large transitions
* Continuous pulse effects

---

# 10. Futuristic Transitions

Transitions should improve orientation and perceived quality.

## 10.1 Page Transitions

Recommended page transition:

* 150–300 millisecond fade
* Slight vertical movement
* No abrupt content flashing

## 10.2 Card Transitions

Cards may use:

* Soft fade-in
* Slight upward movement
* Hover elevation
* Border glow for active status

## 10.3 Measurement Transitions

When a new value appears:

* Count smoothly from the previous value
* Briefly highlight the card
* Update the timestamp
* Avoid aggressive scaling

## 10.4 Panel Transitions

Side panels and bottom sheets should:

* Slide smoothly
* Preserve focus
* Close using Escape on desktop
* Remain fully keyboard accessible

---

# 11. 3D Models and Visualizations

Three-dimensional elements may be used to reinforce the futuristic identity.

## 11.1 Recommended 3D Usage

Possible models:

* HemoSync screening device
* Human hand with finger placement guide
* Sensor module visualization
* Abstract pulse sphere
* Digital anatomical heart model
* Oxygen-particle animation

## 11.2 Appropriate Placement

3D content may appear in:

* Device status panel
* Measurement preparation screen
* Empty dashboard hero section
* Product information modal
* Finger-placement instruction

## 11.3 3D Performance Rules

3D models must:

* Use optimized file sizes
* Load lazily
* Display a static fallback image
* Reduce quality on low-powered devices
* Disable advanced effects on mobile where necessary
* Avoid blocking the main workflow
* Avoid consuming excessive battery or bandwidth

Recommended format:

```text
GLB or GLTF
```

## 11.4 3D Interaction

Acceptable interactions:

* Slow automatic rotation
* Limited mouse drag
* Subtle hover movement
* Guided highlight of sensor placement

Avoid:

* Fast rotation
* Excessive zoom
* Full-screen forced interaction
* Constant particle overload
* Motion that may cause discomfort

---

# 12. AI Screening Summary

## 12.1 AI Summary Content

The AI panel should contain:

* Summary title
* Current reading interpretation
* Historical comparison
* Data-quality confidence
* Supporting evidence
* Suggested next step
* Medical disclaimer
* Generation timestamp

## 12.2 Confidence Display

The confidence indicator must be based on available data quality, not on diagnostic certainty.

Possible factors:

* Signal quality
* Number of valid readings
* Measurement completeness
* Historical record availability
* Recent measurement consistency

Example:

```text
AI Analysis Confidence: 88%

Reason:
- High-quality sensor signal
- Both heart rate and SpO₂ were valid
- Three previous screenings were available
```

## 12.3 Confidence Levels

* High confidence
* Moderate confidence
* Limited confidence
* Insufficient data

Avoid implying:

```text
90% sure the patient has anemia
```

Instead use:

```text
High confidence in the completeness and consistency of the available screening data.
```

## 12.4 Evidence List

The AI summary should include specific evidence:

* Heart rate value
* SpO₂ value
* Signal quality
* Comparison with previous records
* Missing data
* Measurement context

## 12.5 Disclaimer

Every AI summary should include:

```text
This AI-generated summary supports health screening only and is not a medical diagnosis. Results should be reviewed by a qualified healthcare professional.
```

---

# 13. Report and Notification Actions

The dashboard should include:

* Generate Report
* Download Report
* Send Email
* Send SMS
* Resend Notification
* Preview Report

## 13.1 Confirmation

Before sending, show a confirmation modal containing:

* Patient name
* Masked email
* Masked phone number
* Selected channels
* Report date
* Confirm button

## 13.2 Delivery Status

Statuses:

* Pending
* Sending
* Sent
* Delivered
* Failed
* Retrying

## 13.3 Notification Errors

Example email error:

```text
Email delivery failed

The report could not be sent to j***@example.com. Verify the email address or retry later.
```

Example SMS error:

```text
SMS delivery failed

The mobile number may be invalid or the messaging service may be temporarily unavailable.
```

Actions:

* Retry
* Edit Contact Information
* Download Report Instead

---

# 14. Recent Activity

The recent activity panel should display:

* Patient selected
* Screening started
* Measurement completed
* Report generated
* AI summary created
* Email sent
* SMS sent
* Error encountered
* Record updated

Each activity item should include:

* Icon
* Description
* Time
* Status

The list should not become too dense. Show approximately 5–8 recent items and provide a View All action.

---

# 15. Page 2 — Patient Records

## 15.1 Purpose

The Patient Records page allows authorized users to search, review, and manage patient screening history.

---

## 15.2 Patient Search

Search options:

* Patient name
* Patient ID
* Email
* Mobile number

The search should support:

* Debounced input
* Loading indicator
* No-results state
* Clear search button
* Recent patient suggestions

### No Results State

```text
No matching patient found

Check the spelling, search using a patient ID, or register a new patient.
```

---

## 15.3 Patient Profile

The profile section should display:

* Full name
* Patient ID
* Age
* Sex
* Contact information
* Registration date
* Last screening
* Total screenings
* Consent status

Actions:

* Edit Profile
* Start New Screening
* Generate Report
* View Notification History

---

## 15.4 Measurement History

The history section should display:

* Screening date
* Heart rate
* SpO₂
* Signal quality
* AI attention level
* Report status
* Notification status

Desktop may use a table.

Tablet and mobile should use cards or a horizontally scrollable container.

Important columns should remain visible first.

---

# 16. Trend Charts

Charts should display:

* Heart-rate trend
* SpO₂ trend
* Screening frequency
* Measurement-quality history

## 16.1 Chart Requirements

Charts must:

* Resize responsively
* Include readable labels
* Support tooltips
* Include empty states
* Avoid excessive grid lines
* Use accessible contrast
* Include data-table alternatives where possible

## 16.2 Mobile Charts

On mobile:

* Reduce axis labels
* Allow horizontal scrolling only when necessary
* Use touch-friendly tooltips
* Avoid displaying too many data points at once

## 16.3 Empty Chart State

```text
No trend available

At least two completed screenings are required to display a trend.
```

---

# 17. Error Handling

Proper error handling must be implemented throughout the website.

The system should never show:

* Raw server errors
* Stack traces
* Unexplained error codes
* Empty white pages
* Broken layouts
* Frozen loading indicators
* Silent failures

## 17.1 Error Categories

### Validation Errors

Examples:

* Missing patient name
* Invalid email address
* Invalid phone number
* Required field not completed

Display the message next to the affected field.

### Network Errors

Example:

```text
Connection interrupted

The request could not be completed. Check the internet connection and try again.
```

### Server Errors

Example:

```text
Something went wrong

The server could not complete the request. Your entered information has not been lost.
```

### Device Errors

Example:

```text
Sensor not detected

Reconnect the HemoSync device or restart the screening station.
```

### AI Errors

Example:

```text
AI summary unavailable

The measurement was saved successfully, but the AI summary could not be generated. You may retry later.
```

### Notification Errors

Example:

```text
Report saved, but notification failed

The patient record and report are safe. Retry email or SMS delivery from the notification panel.
```

---

## 17.2 Error Recovery

Every error should provide an appropriate recovery action.

Possible actions:

* Retry
* Go Back
* Refresh
* Save as Draft
* Reconnect Device
* Repeat Measurement
* Edit Patient Details
* Download Report
* Contact Administrator

## 17.3 Form Preservation

If a request fails, entered information should remain in the form.

Users should not need to re-enter:

* Patient details
* Contact information
* Screening notes
* Selected options

## 17.4 Global Error Boundary

The frontend should use a global error boundary.

The fallback screen should include:

* Friendly message
* Reload option
* Return to Dashboard
* Error reference ID
* Contact support instruction

Example:

```text
HemoSync encountered an unexpected problem.

Your saved records were not affected.

Reference: HMS-UI-2048
```

---

# 18. Success States

Success messages should be specific.

Avoid:

```text
Success
```

Prefer:

```text
Patient registered successfully.
```

```text
Measurement uploaded successfully.
```

```text
Report sent through email and SMS.
```

Success messages may appear as:

* Toast notification
* Inline banner
* Confirmation card
* Completed animation

Success animations should be subtle and should not delay the next action.

---

# 19. Empty States

Every major section should have a designed empty state.

Required empty states:

* No patient selected
* No device connected
* No screening records
* No AI analysis
* No notifications
* No chart data
* No search results
* No recent activity

Each empty state should include:

* Icon or illustration
* Clear explanation
* Recommended action

---

# 20. Modals, Drawers, and Bottom Sheets

## 20.1 Modal Usage

Use modals for:

* Confirming report delivery
* Editing patient details
* Reviewing report previews
* Confirming logout
* Confirming deletion
* Displaying critical warnings

## 20.2 Mobile Behavior

Wide modals should become:

* Full-screen dialogs
* Bottom sheets
* Stacked forms

## 20.3 Accessibility

Dialogs must:

* Trap keyboard focus
* Close using Escape
* Include a visible close button
* Restore focus after closing
* Use proper ARIA labels

---

# 21. Accessibility Requirements

The website should target WCAG 2.1 AA standards.

Requirements:

* Keyboard navigation
* Visible focus states
* Descriptive button labels
* Screen-reader support
* Sufficient contrast
* Accessible form labels
* Alternative text for images
* Reduced-motion support
* Clear error messages
* Large touch targets
* Proper heading hierarchy
* No information communicated through color alone

Minimum touch target:

```text
44 × 44 pixels
```

---

# 22. Performance Requirements

The website should remain responsive even when charts, AI content, and 3D elements are present.

## 22.1 Performance Practices

* Lazy-load 3D models
* Lazy-load charts below the fold
* Compress images
* Use optimized fonts
* Preload Poppins when appropriate
* Cache patient search results
* Paginate long histories
* Avoid unnecessary re-renders
* Use code splitting
* Minimize layout shifts
* Use skeletons during loading

## 22.2 Core Experience Priority

The following must load before decorative features:

1. Navigation
2. Patient data
3. Device status
4. Measurements
5. Main actions
6. AI panel
7. Charts
8. 3D elements

Decorative visuals must never prevent screening operations.

---

# 23. Security-Related UI Behavior

The interface should support secure usage.

Requirements:

* Mask patient contact details where appropriate
* Automatically log out inactive sessions
* Warn before session expiration
* Prevent unauthorized page access
* Hide restricted actions by role
* Avoid exposing access tokens
* Confirm destructive actions
* Display recent login or account activity when appropriate

---

# 24. Recommended Reusable Components

The website should use a consistent component library.

Suggested components:

* AppHeader
* NavigationTabs
* PatientCard
* DeviceStatusCard
* MeasurementCard
* SignalQualityBadge
* MeasurementProgress
* AIInsightPanel
* ConfidenceIndicator
* EvidenceList
* NotificationPanel
* ActivityTimeline
* PatientSearch
* PatientProfile
* HistoryTable
* TrendChart
* ReportPreview
* LoadingSkeleton
* EmptyState
* ErrorState
* SuccessToast
* ConfirmationModal
* ResponsiveDrawer
* ThreeDDeviceViewer

---

# 25. Interaction Rules

Common actions should generally require no more than two interactions.

Examples:

### Starting a Screening

1. Select patient
2. Start screening

### Sending a Report

1. Select delivery method
2. Confirm

### Viewing Patient History

1. Search patient
2. Select patient

Exceptions are acceptable where confirmation is required for safety or privacy.

---

# 26. Final UX Requirements

The completed HemoSync interface must:

* Remain responsive on all supported devices.
* Never appear overly cramped.
* Use Poppins consistently.
* Provide loading states for every asynchronous operation.
* Provide recovery options for every error.
* Preserve user input after failed requests.
* Include calm futuristic transitions.
* Support optimized 3D elements without reducing performance.
* Maintain readable measurement values.
* Use consistent spacing and card structure.
* Support keyboard and screen-reader navigation.
* Clearly separate AI guidance from medical diagnosis.
* Prioritize patient screening functions over decorative visuals.
* Avoid horizontal overflow.
* Prevent duplicate submissions.
* Clearly communicate device, network, AI, and notification states.
* Provide safe fallbacks when external services fail.

The website should feel advanced and visually distinctive while remaining practical, understandable, and dependable for real healthcare screening workflows.
