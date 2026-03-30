<div align="center">

# ✨ TaskFlow

**Nowoczesna aplikacja PWA do zarządzania zadaniami z kanban board, listami zakupów i synchronizacją w chmurze**

[![Angular](https://img.shields.io/badge/Angular-21+-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

[🚀 **LIVE DEMO**](https://taskflow-two-ebon.vercel.app/) &nbsp;|&nbsp; [📱 Instalacja PWA](#-instalacja-jako-pwa) &nbsp;|&nbsp; [🏗 Architektura](#-architektura)

![TaskFlow Screenshot](./public/images/screen.jpg)
_Dark Mode Kanban Board - główny widok aplikacji_

</div>

---

## 🎯 O projekcie

TaskFlow to **full-featured aplikacja do organizacji zadań i zakupów** zaprojektowana jako PWA (Progressive Web App). Działa na każdym urządzeniu z przeglądarką - od telefonu po desktop.

### Dla kogo?

- 🧑 **Osoby prywatne** - organizacja życia codziennego i zadań domowych
- 💼 **Freelancerzy** - śledzenie projektów i deadline'ów
- 🛒 **Zapominalscy** - lista zakupów z check-off
- 📅 **Zabiegani** - przypomnienia o terminach i priorytetach

---

## ✨ Główne funkcje

### 📋 Task Management

| Funkcja                | Opis                                               | Technologia                |
| ---------------------- | -------------------------------------------------- | -------------------------- |
| **🎯 Kanban Board**    | Przeciągnij i upuść między todo/doing/done         | Angular CDK Drag & Drop    |
| **📊 List View**       | Sortowalna lista z filtrami i wyszukiwaniem        | Signals + Computed         |
| **⚡ Bulk Actions**    | Zaznacz wiele tasków i usuń/oznacz jako done       | Checkbox selection         |
| **🔍 Smart Filtering** | Filtruj po statusie, szukaj po tytule, sortuj      | Real-time computed         |
| **📅 Due Dates**       | Terminy z walidacją (nie można wybrać przeszłości) | HTML5 date + TS validation |
| **❗ Priority Badges** | Wykrzykniki zamiast kolorów (! / !! / !!!)         | Intuicyjne UI              |
| **🏷️ Status Flow**     | todo → doing → done z animacjami                   | CSS transitions            |

### 🛒 Shopping Lists

Osobny moduł do zarządzania zakupami:

- ✅ **Tworzenie list** - np. "Biedronka", "Castorama"
- 📦 **Produkty z opcjonalną ilością** - "Jabłka 1 kg" lub samo "Chleb"
- ✓ **Checklist** - oznaczanie jako kupione
- 📱 **Mobile optimized** - szybkie dodawanie na telefonie

### 🎨 UI/UX

| Feature             | Opis                                         |
| ------------------- | -------------------------------------------- |
| **🌙 Dark Mode**    | Automatyczny i manualny toggle               |
| **📱 Mobile First** | Swipeable kanban, responsywny layout         |
| **⌨️ Klawiatura**   | Enter do zapisu, Escape do anulowania        |
| **🎬 Animacje**     | Slide-out przy done, pulse dla high priority |
| **🔄 Real-time**    | Instant sync między urządzeniami             |

---

## 📱 Instalacja jako PWA

TaskFlow działa jako **natywna aplikacja** na Android i iOS!

### Android (Chrome)

1. Otwórz [taskflow-two-ebon.vercel.app](https://taskflow-two-ebon.vercel.app/) w Chrome
2. Kliknij **⋮** (menu) → "Dodaj do ekranu głównego"
3. Potwierdź "Zainstaluj"
4. Gotowe! 📲 Ikona pojawi się na ekranie głównym

### iOS (Safari)

1. Otwórz [taskflow-two-ebon.vercel.app](https://taskflow-two-ebon.vercel.app/) w Safari
2. Kliknij **Share** (kwadrat ze strzałką) → "Dodaj do ekranu początkowego"
3. Kliknij "Dodaj" w prawym górnym rogu
4. Gotowe! 🍎 Aplikacja działa jak natywna

### Co działa offline?

- ✅ Przeglądanie wcześniej załadowanych tasków
- ✅ Dodawanie nowych tasków (sync gdy wróci internet)
- ✅ Shopping lists
- ✅ Dark mode preference

---

## 🛠 Tech Stack

### Frontend

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)

### Backend / Cloud

![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Auth](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

### Dev Tools

![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 🏗 Architektura

### Repository Pattern

```
┌─────────────────┐
│   Components    │  ← UI (TaskList, TaskCard, ShoppingList)
├─────────────────┤
│  Services       │  ← State management (Signals)
├─────────────────┤
│  Repositories   │  ← Abstrakcja danych (interface)
├─────────────────┤
│ Firestore       │  ← Implementacja cloud
└─────────────────┘
```

### State Management - Signals zamiast NgRx

```typescript
// Reaktywny filtr bez boilerplate'u
readonly filteredTasks = computed(() => {
  const tasks = this.tasks();
  const filter = this.statusFilter();
  const search = this.searchTerm().toLowerCase();

  return tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => t.title.toLowerCase().includes(search));
});
```

### Kluczowe decyzje architektoniczne

1. **Standalone Components** - brak NgModules, prostsza struktura
2. **Dependency Injection** - nowoczesna składnia `inject()`
3. **Fine-grained Reactivity** - Signals dla stanu, RxJS dla async
4. **PWA First** - Service Worker, manifest, ikony dla wszystkich platform

---

## 📦 Instalacja i rozwój

```bash
# 1. Klonowanie
git clone https://github.com/Blazej90/taskflow.git
cd taskflow

# 2. Instalacja (wymagany pnpm)
pnpm install

# 3. Konfiguracja Firebase
# Utwórz projekt w Firebase Console
# Skopiuj config do src/app/firebase.config.ts

# 4. Dev server
pnpm start
# http://localhost:4200

# 5. Testy
pnpm test:unit
```

### Wymagania

- Node.js 20+
- pnpm 10+
- Konto Firebase (opcjonalnie dla offline dev)

---

## 🧪 Testy

```bash
# Uruchomienie testów
pnpm test:unit

# Watch mode
pnpm test
```

**Obecne testy (16):**

- ✅ `DateFormatPipe` - formatowanie dat (8 testów)
- ✅ `AuthService` - logowanie (2 testy)
- ✅ `TasksService` - CRUD, state management (6 testów)

---

## 🎯 Co zostało zaimplementowane

### ✅ Core Features

- [x] **Kanban Board** - drag & drop między kolumnami
- [x] **List View** - alternatywny widok z sortowaniem
- [x] **Dark Mode** - toggle + automatyczny wykrywanie
- [x] **Due Dates** - z walidacją (nie można przeszłości)
- [x] **Priority System** - wykrzykniki (! / !! / !!!)
- [x] **Bulk Actions** - zaznaczanie wielu tasków
- [x] **Responsive** - mobile, tablet, desktop

### ✅ Shopping Module

- [x] **Shopping Lists** - osobne listy zakupów
- [x] **Optional Qty** - ilość opcjonalna (toggle #)
- [x] **Checklist** - oznaczanie kupionych
- [x] **Mobile optimized** - szybkie dodawanie

### ✅ PWA & Performance

- [x] **Service Worker** - działa offline
- [x] **Installable** - "Dodaj do ekranu głównego"
- [x] **iOS Support** - ikony, manifest, standalone
- [x] **Web Manifest** - poprawne metadane

### ✅ UX & Polish

- [x] **Animations** - slide-out, pulse, fade
- [x] **Toast Notifications** - success/error feedback
- [x] **Confirm Dialogs** - potwierdzenie przy usuwaniu
- [x] **Keyboard Shortcuts** - Enter, Escape
- [x] **Accessibility** - ARIA labels, focus states

---

## 🗺 Roadmap (przyszłość)

- [ ] **Subtasks** - podzadania w tasku
- [ ] **Tags/Labels** - #work #personal #shopping
- [ ] **File Attachments** - Firebase Storage
- [ ] **Shared Lists** - współdzielenie z innymi użytkownikami
- [ ] **Time Tracking** - śledzenie czasu spędzonego na tasku
- [ ] **Statistics** - wykresy produktywności
- [ ] **Notifications** - Web Push dla deadline'ów

---

## 👨‍💻 Autor

**Błażej Bartoszewski**

[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=flat-square&logo=google-chrome&logoColor=white)](https://blazej-portfolio-sand.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Blazej90)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/błażej-bartoszewski-36b7162b7)

---

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

---

<div align="center">

**[⬆ Powrót na górę](#-taskflow)**

Made with ❤️ and ☕ by Błażej Bartoszewski

</div>
