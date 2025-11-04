# **App Name**: RiskMatrix Pro

## Core Features:

- Authentication and Authorization: Secure access with email/password and Google SSO. Role-based permissions for admin, manager, regional, and viewer profiles.
- Risk Calculation Engine: Calculate risk index based on the formula: risk = (criticidade_peso * impacto_peso * urgência_peso).  Criticidade A=3, B=2, C=1. Impacto operacional includes safety, production, sales and enviromental aspects.
- Contingency Plan and Incident Log: Log incidents and their timelines. Display which plans are applicable in each particular situation. Keep track of actions taken to follow contingency plans. Use an LLM-powered tool to suggest relevant contingency plans based on incident characteristics. Allow setting timers to trigger notifications when approaching deadlines for meeting SLAs.
- Equipment Registry: Allow creating and managing an equipment registry with its characteristics.
- Preventative Maintenance Schedule: Capture preventative maintenance checklists and their intervals.
- Supplier Performance Management: Manage supplier information, including SLAs and performance metrics such as MTTA and MTTR.
- Interactive Dashboards: Visualize risk rankings, SLA compliance with traffic lights, and heatmaps by category. Show ranking of risks by unit, category, and equipment.

## Style Guidelines:

- Primary color: Deep Blue (#1E3A8A), evoking trust and reliability for risk management. 
- Background color: Light Blue (#E3F2FD), a desaturated pastel tone for a calm, neutral backdrop.
- Accent color: Bright Orange (#EA580C) to highlight critical alerts and key performance indicators, drawing immediate attention.
- Font pairing: 'Inter' (sans-serif) for both headlines and body text, providing a modern, readable interface. 'Source Code Pro' for displaying code snippets.
- Use color-coded icons to represent risk levels (A=red, B=yellow, C=green) and status indicators throughout the interface.
- Employ a grid layout for the risk matrix and detailed equipment views. Use filters to sort and find equipment easily.
- Use subtle transitions and animations to provide feedback on interactions. Avoid using distracting animations.