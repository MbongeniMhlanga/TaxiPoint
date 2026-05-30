# TaxiPoint

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-20232A?style=for-the-badge&logo=vite&logoColor=646CFF" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-20232A?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-20232A?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4" alt="Tailwind CSS" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-20232A?style=for-the-badge&logo=springboot&logoColor=6DB33F" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Java-20232A?style=for-the-badge&logo=openjdk&logoColor=F89917" alt="Java" />
  <img src="https://img.shields.io/badge/PostgreSQL-20232A?style=for-the-badge&logo=postgresql&logoColor=4169E1" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Expo-20232A?style=for-the-badge&logo=expo&logoColor=FFFFFF" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Leaflet-20232A?style=for-the-badge&logo=leaflet&logoColor=199900" alt="Leaflet" />
</p>

TaxiPoint is a web and mobile platform for finding taxi ranks in Johannesburg, viewing route information, reporting incidents, and managing corrections in real time.

## What TaxiPoint Uses

| Area | Stack |
| --- | --- |
| Web frontend | React, Vite, TypeScript, Tailwind CSS, React Router, React Toastify, Framer Motion, Leaflet |
| Mobile app | Expo, React Native, Expo Router, react-native-maps, expo-location, AsyncStorage |
| Backend | Spring Boot, Spring Security, Spring Data JPA, Spring WebSocket, Java Mail, SendGrid, JWT |
| Database | PostgreSQL, PostGIS, JSONB |
| Realtime | SockJS, STOMP, WebSockets |

## Repository Layout

- `backend/taxipoint/taxipoint` - Spring Boot API
- `frontend/taxipoint` - React web app
- `mobile/TaxiPoint` - Expo mobile app

## Prerequisites

- Node.js 18 or newer
- Java 21
- Maven 3.9 or newer
- PostgreSQL with PostGIS enabled
- Expo Go or Android Studio if you want to run the mobile app locally

## Setup

### 1) Backend

```bash
cd backend/taxipoint/taxipoint
mvn clean install
mvn spring-boot:run
```

Backend environment variables:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE`
- `SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE`
- `SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT`
- `SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT`
- `SPRING_DATASOURCE_HIKARI_MAX_LIFETIME`
- `SPRING_DATASOURCE_HIKARI_KEEPALIVE_TIME`
- `SPRING_DATASOURCE_HIKARI_LEAK_DETECTION_THRESHOLD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`
- `SPRING_MAIL_HOST`
- `SPRING_MAIL_PORT`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `SPRING_MAIL_FROM_EMAIL`
- `SPRING_MAIL_API_KEY`
- `APPLICATION_FRONTEND_URL`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`

### 2) Web Frontend

```bash
cd frontend/taxipoint
npm install
npm run dev
```

Useful frontend notes:

- The web app currently points to the deployed backend in `frontend/taxipoint/src/config.ts`.
- If you want to run the backend locally, update `API_BASE_URL` before starting the frontend.

### 3) Mobile App

```bash
cd mobile/TaxiPoint
npm install
npx expo start
```

Useful mobile notes:

- The mobile app currently points to the deployed backend and websocket URL in `mobile/TaxiPoint/config.ts`.
- If you want to run the backend locally, update `API_BASE_URL` and `WS_BASE_URL` before starting Expo.

## Database Structure

The main database entities are shown below.

![TaxiPoint database structure](docs/database-structure.svg)

Main tables and relationships:

- `users` stores account details and user preferences.
- `taxi_ranks` stores rank metadata, routes, fares, hours, and location.
- `incidents` stores public incident reports and their resolved status.
- `correction_submissions` stores pending and reviewed correction requests.
- `correction_votes` stores admin/community review votes for corrections.
- `password_reset_tokens` stores temporary reset tokens for account recovery.

Relationship summary:

- `correction_submissions.rank_id` points to `taxi_ranks.id`.
- `correction_submissions.submitted_by_user_id` and `correction_submissions.reviewed_by_user_id` track the user lifecycle.
- `correction_votes.submission_id` points to `correction_submissions.id`.
- `correction_votes.voter_user_id` stores the user who cast the vote.
- `password_reset_tokens.email` stores the account email used during recovery.

## Helpful Commands

### Frontend

```bash
npm run build
npm run lint
```

### Backend

```bash
mvn test
```

### Mobile

```bash
npx expo lint
```

