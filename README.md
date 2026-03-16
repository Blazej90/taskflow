<div align="center">

# ✨ TaskFlow

**Nowoczesna aplikacja do zarządzania zadaniami z kanban board i real-time synchronizacją**

[![Angular](https://img.shields.io/badge/Angular-21+-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

[🚀 **LIVE DEMO**](https://taskflow-two-ebon.vercel.app/) &nbsp;|&nbsp; [📸 Zrzuty ekranu](#-zrzuty-ekranu) &nbsp;|&nbsp; [🏗 Architektura](#-architektura)

![TaskFlow Screenshot](./public/images/screen.jpg)

</div>

---

## 🎯 Dlaczego ten projekt?

TaskFlow to nie tylko kolejna aplikacja TODO - to **pokaz moich umiejętności** jako Angular Developera:

- **Angular 21+** z najnowszymi funkcjami (Standalone Components, Signals, `inject()`)
- **Repository Pattern** dla czystej architektury i testowalności
- **Real-time sync** z Firestore bez zbędnej złożoności
- **UX-focused** - drag & drop, bulk actions, responsywność mobilna
- **Testy jednostkowe** z Vitest zamiast Jasmine/Karma

---

## ✨ Funkcjonalności

| Feature                | Opis                                                               | Technologia                  |
| ---------------------- | ------------------------------------------------------------------ | ---------------------------- |
| **🎯 Kanban Board**    | Przeciągnij i upuść zadania między kolumnami todo/doing/done       | Angular CDK Drag & Drop      |
| **📦 Bulk Actions**    | Zaznacz wiele zadań i usuń/oznacz jako done na raz                 | Signals + Checkbox selection |
| **🔍 Smart Filtering** | Filtruj po statusie, szukaj po tytule, sortuj po dacie/priorytecie | Computed Signals             |
| **📱 Mobile First**    | Swipeable kanban na mobile, responsywny layout                     | CSS Grid + Flexbox           |
| **⚡ Real-time**       | Instant sync między urządzeniami dzięki Firestore                  | Firebase onSnapshot          |
| **🔐 Auth**            | Logowanie Google OAuth lub Magic Link (bez hasła)                  | Firebase Auth                |

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

### Dev Tools

![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 🏗 Architektura

### Repository Pattern

Aplikacja używa **abstrakcji warstwy danych**, co pozwala łatwo zmieniać implementację (localStorage ↔ Firestore) bez zmiany logiki biznesowej:

```
┌─────────────────┐
│   Components    │  ← UI (TaskList, TaskCard)
├─────────────────┤
│  TasksService   │  ← State management (Signals)
├─────────────────┤
│ TasksRepository │  ← Abstrakcja (interface)
├─────────────────┤
│ Firestore /     │  ← Implementacja
│ LocalStorage    │
└─────────────────┘
```

### State Management bez NgRx

Zamiast NgRx użyłem **Angular Signals**:

- Prostszy mental model
- Mniej boilerplate'u
- Lepsza wydajność (fine-grained reactivity)
- Łatwiejsze testowanie

```typescript
// Przykład reaktywności
readonly filteredTasks = computed(() => {
  const tasks = this.tasks();
  const filter = this.statusFilter();
  return filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
});
```

---

## 📸 Zrzut ekranu

![TaskFlow Kanban Board](./public/images/screen.jpg)

Powyższy screen pokazuje **główny widok aplikacji** z kanban board.

Aplikacja oferuje również:

- 📱 **Mobile view** - swipeable kolumny na telefonie
- ✏️ **Formularz edycji** - tworzenie i edycja zadań z walidacją
- 🔐 **Ekran logowania** - Google Sign-In i Magic Link
- 📦 **Bulk actions** - zaznaczanie wielu zadań naraz

---

## 📦 Instalacja i uruchomienie

```bash
# 1. Klonowanie repozytorium
git clone https://github.com/Blazej90/taskflow.git
cd taskflow

# 2. Instalacja zależności (wymagany pnpm)
pnpm install

# 3. Konfiguracja Firebase
# Utwórz projekt w Firebase Console
# Skopiuj config do src/app/firebase.config.ts

# 4. Uruchomienie deweloperskie
pnpm start
# Aplikacja dostępna na http://localhost:4200

# 5. Testy jednostkowe
pnpm test:unit
```

### Wymagania

- Node.js 20+
- pnpm 10+
- Konto Firebase (dla full functionality)

---

## 🧪 Testy

Projekt zawiera testy jednostkowe napisane w **Vitest**:

```bash
# Uruchomienie testów
pnpm test:unit

# Watch mode
pnpm test:watch
```

**Pokrycie testami:**

- ✅ `TasksService` - operacje CRUD, bulk actions, state management
- ✅ `AuthService` - logowanie, obsługa błędów
- ✅ Mocki repozytorium dla izolowanych testów

---

## 🎯 Kluczowe implementacje

### 1. Per-task loading states

Zamiast jednego globalnego loadera, każde zadanie ma własny stan ładowania:

```typescript
// Użytkownik widzi, które konkretnie zadanie się aktualizuje
readonly updatingIds = signal<Set<string>>(new Set());
```

### 2. Optimistic UI z rollbackiem

Operacje wykonują się natychmiast w UI, z możliwością cofnięcia przy błędzie.

### 3. SSR-safe code

Wszystkie operacje na window/document są opakowane w `isPlatformBrowser()`.

### 4. Dependency Injection bez konstruktorów

Nowoczesna składnia Angulara:

```typescript
export class TaskCard {
  private tasksService = inject(TasksService);
  readonly task = input.required<Task>();
}
```

---

## 🚀 Deployment

Aplikacja jest automatycznie deployowana na **Vercel** przy każdym pushu do main.

```bash
# Manualny build produkcyjny
pnpm build

# Preview lokalny
pnpm preview
```

---

## 📚 Czego się nauczyłem?

1. **Signals vs RxJS** - kiedy które użyć? Signals dla synchronicznego stanu UI, RxJS dla async strumieni.

2. **Repository Pattern w Angular** - jak zrobić clean architecture bez over-engineeringu.

3. **Firebase Auth** - implementacja Magic Link wymagała zrozumienia deep links i localStorage.

4. **CDK Drag & Drop** - obsługa między-kolumnowych dropów w kanban wymagała custom logiki.

---

## 🗺 Roadmap

- [ ] Dark mode toggle
- [ ] Due dates dla zadań
- [ ] Attachments (Firebase Storage)
- [ ] Task labels/tags
- [ ] Offline support (service worker)
- [ ] PWA install

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
