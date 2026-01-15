# 🎤 PitchMate: AI Presentation Assistant

> **"무대 위, 당신의 언어가 예술이 되다."** <br/>
> **PitchMate**는 발표 준비의 시작부터 리허설까지 책임지는 **All-in-One AI 프레젠테이션 코칭 솔루션**입니다.

[![Demo Video](https://github.com/user-attachments/assets/dd6c7229-e03f-44ca-b949-c383469c9825)](https://github.com/IBM2026-Team6/fronted/blob/main/assets/2026%20%EA%B0%95%EB%A6%89%EC%9B%90%EC%A3%BC%EB%8C%80X%EA%B0%95%EC%9B%90%EB%8C%80%20IBM%20HACKATHON.mp4)
---

## ✨ Key Features Overview

> 발표자료 요약 → 대본 생성 → 실전 리허설 → 사전 평가까지  
> 발표의 전반적인 과정을 하나의 워크플로우로 통합한 **AI 기반 발표 준비 도구**입니다.

| Feature | Description | Preview |
|--------|------------|---------|
| 🏠 **Cinematic Landing** | 시네마틱 다크 UI 기반 랜딩 페이지<br/>서비스 흐름(Prep → Script → Live)을 직관적으로 안내 | <video src="https://github.com/user-attachments/assets/c8b1d73e-d711-46e8-85d2-dc00d849f61a" width="140" controls></video> |
| 🧠 **Prep Flow** | PDF 발표 자료를 분석하여<br/>서론–본론–결론 구조로 재구성 및 요약 | <video src="https://github.com/user-attachments/assets/dac952b2-8412-465d-8b3a-2e514a32348f" width="140" controls></video> |
| ✍️ **Prep Script** | 청중·스타일 기반 AI 발표 대본 생성<br/>섹션별 시간·큐·예상 질문 포함 | <video src="https://github.com/user-attachments/assets/8803e1b5-793a-4448-acea-e6046af4d9be" width="140" controls></video> |
| 🔴 **Live Mode** | 음성 인식 기반 실전 리허설 모드<br/>키워드 트래킹 + 타이머 + 프롬프터 | <video src="https://github.com/user-attachments/assets/6323c604-3972-4ae3-8c7d-9c90ec53e1e1" width="140" controls></video> |
| 📊 **Prep Eval** | 공고·평가기준 기반 AI 모의 심사<br/>점수·등급·개선 피드백 제공 | <video src="https://github.com/user-attachments/assets/ef498440-da72-418a-8075-42112adaa452" width="140" controls></video> |

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
   git clone https://github.com/IBM2026-Team6/fronted.git
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
   npm run dev
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
│   ├── PrepEval.tsx     # Based AI, Mock Evaluation
│   └── LiveMode.tsx     # Rehearsal dashboard
├── services/
│   └── geminiService.ts # Google GenAI integration logic
│   └── backendService.ts # Fast API(Backend) integration logic
├── utils/
│   └── pdfHelper.ts     # PDF parsing utility
├── types.ts             # TypeScript interfaces
├── App.tsx              # Main router/layout
└── index.tsx            # Entry point
```
---

## 🔗 Links

- PPT Link: https://www.canva.com/design/DAG-YFYljqE/kZmxoRisqGe9q0Xl0XRvbA/view?utm_content=DA[…]hare&utm_medium=link2&utm_source=uniquelinks&utlId=h61b4189256
- Notion Link: https://www.notion.so/2e19761f2ffc8105a46edf86f01d3278?pvs=13
- Girhub Link: https://github.com/IBM2026-Team6

---

## 📜 License

This project is created for the IBM 2026 Hackathon.
Copyright © 2026 PitchMate Team.
