---
layout: post
title: "Vue 컴포넌트의 구조와 생명주기"
date: 2026-08-03 00:00:00 +0900
categories: [Frontend, Vue]
tags: [Frontend, Vue.js, Component, SFC, Lifecycle]
description: "소프트웨어 컴포넌트의 개념부터 Vue 컴포넌트의 계층 구조, 지역·전역 등록, 내장 함수, 생명주기까지 정리한다."
summary: "Vue 컴포넌트의 기본 개념과 등록 방법, 주요 내장 함수, 생명주기를 예제와 표로 정리한다."
---

# Vue 컴포넌트의 구조와 생명주기

## 1. Component란?

소프트웨어 공학에서 컴포넌트(Component)는 독립적인 기능을 수행하고, 필요할 때 다른 부품으로 교체하거나 다른 프로그램과 연결할 수 있는 표준화된 소프트웨어 모듈을 말한다.

컴포넌트의 핵심 특징은 다음과 같다.

- **독립성(Independence)**: 기능과 책임이 하나의 단위로 분리된다.
- **교체 가능성(Replaceability)**: 같은 역할을 수행하는 다른 컴포넌트로 교체할 수 있다.
- **재사용성(Reusability)**: 여러 화면이나 프로젝트에서 반복해서 사용할 수 있다.

## 2. Vue Component란?

Vue 컴포넌트는 웹 페이지를 구성하는 독립적이고 재사용 가능한 블록이다.

Vue에서는 HTML, CSS, JavaScript를 하나의 `.vue` 파일에 모아 작성하는 방식을 SFC(Single-File Component)라고 한다.

하나의 애플리케이션은 여러 컴포넌트를 조립해 완성하며, 컴포넌트들은 트리 구조로 연결된다.

```text
App
├── Header
├── Main
│   ├── UserProfile
│   └── ProductList
└── Footer
```

## 3. Component Hierarchy

컴포넌트 계층 구조에서 자주 사용하는 관계는 다음과 같다.

| 관계 | 의미 | 데이터 전달 방식 |
| --- | --- | --- |
| Parent-Child | 부모가 자식을 포함하는 관계 | 부모에서 자식으로 `props`, 자식에서 부모로 `emit` |
| Sibling | 같은 부모 아래에 나란히 있는 형제 관계 | 부모를 통해 상태를 공유하거나 공통 저장소 사용 |
| Ancestor-Descendant | 자식의 자식까지 이어지는 다층 계층 관계 | `provide`와 `inject`, 공통 저장소 등을 사용 |

부모와 자식은 서로 독립된 컴포넌트다. 자식은 부모의 상태를 직접 수정하지 않고 `props`로 전달받으며, 부모에게 필요한 이벤트는 `emit`으로 알린다.

## 4. Component 지역 등록

지역 등록은 특정 부모 컴포넌트에서만 자식 컴포넌트를 사용하는 방식이다.

- 부모 컴포넌트에서 자식 컴포넌트를 import한다.
- 등록한 자식 컴포넌트는 `<template>` 영역에서 컴포넌트 태그처럼 사용할 수 있다.
- 컴포넌트 이름은 일반적으로 PascalCase를 사용한다.
- `<script setup>`에서는 import한 컴포넌트가 자동으로 등록된다.

```vue
<script setup>
import BaseButton from './components/BaseButton.vue'
</script>

<template>
  <div class="box">
    <h3>컴포넌트 조립 테스트</h3>
    <hr>
    <BaseButton />
  </div>
</template>
```

## 5. Component 전역 등록

전역 등록한 컴포넌트는 Vue 애플리케이션의 여러 컴포넌트에서 별도의 import 없이 사용할 수 있다.

전역 등록은 보통 `main.js`에서 수행한다.

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import BaseButton from './components/BaseButton.vue'
import BaseInput from './components/BaseInput.vue'

const app = createApp(App)

app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)

app.mount('#app')
```

`app.component()`의 첫 번째 인자는 템플릿에서 사용할 컴포넌트 이름이고, 두 번째 인자는 import한 컴포넌트 변수다.

## 6. Vue 주요 내장 함수

Vue는 애플리케이션 생성, 반응형 상태 관리, 계산과 감시, 컴포넌트 조립 등을 위한 함수를 제공한다.

| 카테고리 | 주요 함수 |
| --- | --- |
| 애플리케이션(Application) | `createApp`, `createSSRApp`, `app.*`, `app.config.*` |
| 반응형 상태(Reactive State) | `ref`, `reactive`, `readonly`, `shallowRef`, `shallowReactive`, `shallowReadonly`, `toRef`, `toRefs`, `customRef`, `unref`, `toRaw`, `markRaw`, `isRef`, `isReactive`, `isReadonly` |
| 계산 및 감시(Computed & Watchers) | `computed`, `watch`, `watchEffect` |
| 라이프사이클 훅(Lifecycle Hooks) | `onBeforeMount`, `onMounted`, `onBeforeUpdate`, `onUpdated`, `onBeforeUnmount`, `onUnmounted`, `onActivated`, `onDeactivated`, `onErrorCaptured`, `onRenderTracked`, `onRenderTriggered` |
| 컴포넌트 구성(Component Composition) | `defineComponent`, `defineProps`, `defineEmits`, `useAttrs`, `defineExpose`, `useSlots`, `withDefaults`, `getCurrentInstance` |
| 렌더링 제어(Rendering & DOM) | `h`, `resolveComponent`, `withDirectives`, `renderList`, `renderSlot`, `mergeProps`, `nextTick`, `useCssModule`, `useCssVars` |
| 의존성 주입(Dependency Injection) | `provide`, `inject`, `hasInjectionContext` |

## 7. Component Lifecycle

컴포넌트 생명주기는 컴포넌트가 생성되고, 화면에 연결되고, 갱신된 뒤 제거되는 흐름이다.

| 단계 | 컴포넌트의 상태 | 주요 작업과 훅 |
| --- | --- | --- |
| 생성 및 설정(Creation & Setup) | 컴포넌트 인스턴스가 만들어지고 JavaScript에서 사용할 준비를 하는 단계 | `ref`, `reactive`, `computed`, `watch` 등을 초기화한다. |
| 부착(Mounting) | 가상으로 구성한 화면을 실제 DOM에 연결하는 단계 | DOM에 접근하거나 초기 데이터를 요청한다. `onMounted`를 사용한다. |
| 갱신(Updating) | 반응형 데이터가 변경되어 화면을 다시 그리는 단계 | 업데이트된 DOM을 확인하거나 크기와 스크롤 위치를 다시 계산한다. `onUpdated`를 사용한다. |
| 소멸(Unmounting) | `v-if="false"` 등의 조건으로 컴포넌트가 화면에서 제거되는 단계 | 타이머와 이벤트 리스너를 정리해 메모리 누수를 방지한다. `onUnmounted`를 사용한다. |

라이프사이클 훅을 사용한 간단한 예시는 다음과 같다.

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue'

const handleResize = () => {
  console.log(window.innerWidth)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
```

`onMounted`에서 등록한 이벤트 리스너는 `onUnmounted`에서 제거해야 컴포넌트가 사라진 뒤에도 불필요한 동작이 남지 않는다.


# Props & Emits 

Component 연동
- Vue 3의 모든 컴포넌트 연동은"데이터는 위에서 아래로 물려주고, 이벤트는 아래에서 위로 쏘아 올린다"는 구조를 따른다.

분류 🔽 Props (하행선) 🔼 Emits (상행선)
개념 정의 부모가 자식에게 주는 반응형 데이터 값 자식이 부모에게 보고하는 이벤트
흐름 방향 부모 → 자식 (위에서 아래로) 자식 → 부모 (아래에서 위로)
데이터 권한 읽기 전용. 자식은 수정 불가 부모에게 변경 요청 및 값 전달 가능
Compiler Macro defineProps({ ... }) defineEmits([ ... ])
Parent Binding 자식 태그 속성에 콜론(:)으로 주입 자식 태그 이벤트에 골뱅이(@)로 청취

Compiler Macro란 Runtime 시점이 아닌 Build 시점에 Vue Compiler가 코드를 변환하는 특수 예약어로 defineProps(),
defineEmits(), defineExpose() 같은 함수들은 <script setup>에서만 사용이 가능

defineProps() - 속성 정의

자식 컴포넌트 내부에서"부모가 넘겨줄 데이터(속성)의 이름과 규격"을 선언하는 Vue 3 내장 컴파일러 매크로 함수
- Compiler Macro이기 때문에 상단에 import할 필요 없이 <script setup> 안에서 즉시 호출할 수 있다
- 간단한 배열 표기법과, 강력한 객체 표기법이 있다

[배열 형식]
const props = defineProps(['title', 'count'])

[객체 형식– 기본값 지정]
defineProps({
// 1. 타입만 간단히 지정하는 경우
title: String,
// 2. 필수 값과 기본값까지 꼼꼼하게 지정하는 경우
likes: {
type: Number,
required: true // 부모가 이 값을 안 넘기면 에러발생.
},
status: {
type: String,
default: ＇대기 중＇ // 부모가 값을 안 주면 이 값이 기본으로 세팅.
}
})

▪ <template> 에서 사용하기
• 정의된 변수를 그대로 사용하면 된다.
<template>
<h1>{{ title }}</h1>
<p>좋아요: {{ likes }}</p>
</template>
▪ <script setup> 에서 사용하기
• defineProps가 반환하는 객체를 변수(보통 props라는 이름)에 받아서.점 문법으로 접근해야 한다.
<script setup>
// 변수에 결과를 할당합니다.
const props = defineProps({
title: String,
likes: Number
})
// 내부 함수에서 쓸 때는 props.을 앞에 꼭 붙여야 합니다.
const checkPopularity = () => {
if (props.likes > 100) {
console.log(`${props.title}은 인기 게시글입니다.`)
}
}
</script>

Readonly
• defineProps로 Parent에서 전달된 값은 읽기 전용(ReadOnly)이다.
• Child Component에서 이 값을 직접 바꾸려고 하면 에러가 발생된다.

const props = defineProps(['likes'])
const brokenFunction = () => {
// ❌ 절대 금지! 콘솔에 ReadOnly 에러 발생.
props.likes = 999
}