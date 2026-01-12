# 🎤 LiveCoach (AI Presentation Assistant)

> **"무대 위, 당신의 언어가 예술이 되다."**
> 
> **LiveCoach**는 발표 준비의 시작부터 리허설까지 책임지는 All-in-One AI 프레젠테이션 코칭 솔루션입니다. IBM 2026 Hackathon을 위해 제작되었으며, IBM Watson AI & Upstage API & Google Gemini API의 강력한 추론 능력을 활용하여 논리적 구조 설계와 맞춤형 대본 작성을 돕습니다.

---

## ✨ Key Features

### 1. 🏠 Cinematic Landing & Social Proof
- **몰입형 디자인**: 스포트라이트 효과와 부드러운 스크롤 애니메이션(`reveal-on-scroll`)으로 사용자의 시선을 사로잡습니다.
- **사용자 후기 (Testimonials)**: 3D Tilt 효과가 적용된 카드 UI를 통해 솔루션의 효용성을 시각적으로 전달합니다.
- **동적 반응형**: 마우스 움직임에 따라 반응하는 배경 효과와 애니메이션 요소를 포함합니다.

### 2. 🧠 Prep Flow (구조 분석)
- **PDF 자료 분석**: 사용자가 업로드한 발표 자료(PDF)를 `pdf.js`로 텍스트화하여 분석합니다.
- **논리적 시각화**: 발표 내용을 서론-본론-결론의 논리적 흐름으로 재구성하고, 각 파트별 핵심 요약을 제공합니다.
- **Glassmorphism UI**: 분석 로딩 중에도 심미적인 만족감을 주는 투명한 오버레이 애니메이션을 제공합니다.

### 3. ✍️ Prep Script (AI 대본 작가)
- **맞춤형 페르소나 설정**: 청중(전문가/비전문가), 스타일(스토리텔링/전문적), 비언어적 표현 포함 여부를 설정할 수 있습니다.
- **Gemini 3 Flash 활용**: 최신 AI 모델을 사용하여 자연스러운 한국어 대본을 생성합니다.
- **인터랙티브 에디터**: 
  - 섹션별 예상 소요 시간을 AI가 제안하며, 사용자가 직접 수정하여 전체 발표 시간을 조절할 수 있습니다.
  - **다운로드 기능**: 완성된 대본을 `.txt` 파일로 즉시 다운로드할 수 있습니다.

### 4. 🔴 Live Mode (실전 리허설)
- **On-Air HUD**: 실제 뉴스룸이나 프롬프터를 연상시키는 어두운 테마의 대시보드입니다.
- **실시간 타이머 & 체크리스트**: 발표 시간을 체크하고 핵심 포인트 도달 여부를 클릭 한 번으로 관리합니다.
- **메모/프롬프터**: 발표 중 참고할 메모를 작성하고 띄워놓을 수 있습니다.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS (Custom Animations, Glassmorphism effects)
- **AI Model**: Google Gemini API (`gemini-3-flash-preview`)
- **Utilities**: 
  - `pdfjs-dist`: PDF 텍스트 추출
  - `@google/genai`: Gemini SDK

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/live-coach.git
   cd live-coach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the application**
   ```bash
   npm start
   ```

---

## 📂 Project Structure

```
/
├── components/
│   ├── Home.tsx         # Landing page with animations & testimonials
│   ├── Navbar.tsx       # Responsive navigation
│   ├── PrepFlow.tsx     # Logic analysis structure
│   ├── PrepScript.tsx   # Script generation & download
│   └── LiveMode.tsx     # Rehearsal dashboard
├── services/
│   └── geminiService.ts # Google GenAI integration logic
├── utils/
│   └── pdfHelper.ts     # PDF parsing utility
├── types.ts             # TypeScript interfaces
├── App.tsx              # Main router/layout
└── index.tsx            # Entry point
```

---

## 🎨 UI/UX Highlights

- **Micro-interactions**: Hover 시 발생하는 3D 회전, 버튼의 빛나는 효과 등 세밀한 인터랙션 구현.
- **Smooth Transitions**: 페이지 전환 및 모달 등장 시 끊김 없는 애니메이션 적용.
- **Accessible & Professional**: 가독성 높은 Serif/Sans-serif 폰트 조합과 눈이 편안한 Stone/Green 컬러 팔레트 사용.

---

## 📜 License

This project is created for the IBM 2026 Hackathon.
Copyright © 2026 LiveCoach Team.