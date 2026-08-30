---
layout: post
title: "04. Vue 컴포넌트 설계: props, emit, slot과 생명주기"
date: 2026-08-03 01:00:00 +0900
categories: [Frontend, Vue]
tags: [Frontend, Vue.js, Component, Props, Emits, Slots, Lifecycle]
description: "Vue 컴포넌트의 구조와 데이터 흐름, 상태 위치를 결정하는 기준, 생명주기 훅을 예제로 정리."
summary: "Vue 컴포넌트의 입력과 출력, 콘텐츠 확장, 상태 공유 범위와 생명주기 정리 방법을 살펴본다."
key_concepts:
  - "부모는 props로 데이터를 전달하고 자식은 emit으로 변경 의도를 알림."
  - "slot은 공통 구조를 유지하면서 내부 콘텐츠를 교체."
  - "상태는 필요한 컴포넌트 범위 중 가장 작은 곳에 둠."
excerpt_separator: "<!--more-->"
legacyPath: "/frontend/vue/2026/08/03/vue-component/"
---
## 컴포넌트란?

Vue 컴포넌트는 화면과 동작을 독립적이고 재사용 가능한 단위로 나눈 것이다. 한 컴포넌트가 하나의 명확한 책임을 가지면 테스트와 변경이 쉬워진다.

```text
App
├── AppHeader
├── ProductList
│   └── ProductCard
└── ShoppingCart
```

Vue에서는 보통 `.vue` 파일 하나에 템플릿, 로직, 스타일을 작성한다. 이를 SFC(Single-File Component)라고 한다.

<!--more-->


```vue
<script setup>
const title = '상품 목록'
</script>

<template>
  <section class="product-list">
    <h2>{{ title }}</h2>
  </section>
</template>

<style scoped>
.product-list {
  padding: 1rem;
}
</style>
```

## 지역 등록과 전역 등록

`<script setup>`에서 컴포넌트를 import하면 현재 컴포넌트의 템플릿에서 바로 사용할 수 있다.

```vue
<script setup>
import BaseButton from './components/BaseButton.vue'
</script>

<template>
  <BaseButton />
</template>
```

이런 **지역 등록**을 기본으로 사용하면 의존성이 파일에 드러나고, 사용하지 않는 컴포넌트를 빌드 도구가 제거하기 쉽다.

앱 전체에서 반복하는 매우 기본적인 컴포넌트는 전역 등록할 수도 있다.

```js
import { createApp } from 'vue'
import App from './App.vue'
import BaseButton from './components/BaseButton.vue'

const app = createApp(App)

app.component('BaseButton', BaseButton)
app.mount('#app')
```

전역 등록이 많아지면 어디에서 컴포넌트가 왔는지 찾기 어려워지므로 제한적으로 사용한다.

## 컴포넌트의 공개 인터페이스

재사용 가능한 컴포넌트는 입력과 출력을 명확하게 만든다.

| 기능 | 방향 | 역할 |
| --- | --- | --- |
| `props` | 부모 → 자식 | 데이터와 설정을 전달 |
| `emit` | 자식 → 부모 | 사용자 행동과 변경 의도를 알림 |
| `slot` | 부모 → 자식 내부 | 자식의 특정 위치에 콘텐츠를 넣음 |

### props: 부모가 데이터를 전달

`ProductCard`는 어떤 상품을 보여줄지 직접 찾지 않고 `props`로 받는다. 그래야 같은 컴포넌트로 여러 상품을 표현할 수 있다.

```vue
<!-- ProductCard.vue -->
<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const logProduct = () => {
  console.log(props.product.id)
}
</script>

<template>
  <article>
    <h3>{{ product.name }}</h3>
    <p>{{ product.price.toLocaleString() }}원</p>
    <button @click="logProduct">확인</button>
  </article>
</template>
```

```vue
<!-- 부모 컴포넌트 -->
<ProductCard :product="selectedProduct" />
```

`defineProps()`와 `defineEmits()`는 `<script setup>`에서 사용하는 컴파일러 매크로이므로 import하지 않는다. props는 읽기 전용이며 자식이 직접 수정하지 않는다.

### emit: 자식이 변경 의도를 알린다

자식은 부모의 상태를 직접 바꾸는 대신 이벤트를 발생시킨다.

```vue
<!-- ProductCard.vue -->
<script setup>
defineProps({
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['add-to-cart'])
</script>

<template>
  <button @click="emit('add-to-cart', product.id)">
    장바구니에 담기
  </button>
</template>
```

```vue
<!-- 부모 컴포넌트 -->
<script setup>
const addToCart = (productId) => {
  console.log('추가할 상품:', productId)
}
</script>

<template>
  <ProductCard
    :product="selectedProduct"
    @add-to-cart="addToCart"
  />
</template>
```

데이터 흐름을 한 방향으로 유지하면 상태를 누가 소유하고 변경하는지 추적하기 쉽다.

```text
부모 상태 ──props──> 자식 화면
부모 함수 <──emit── 자식 행동
```

### slot: 구조는 자식이, 콘텐츠는 부모가 정한다

~~자 재탕해보자, 어머니의 사골국이 떠오른다. 연속으로 12일동안 먹어봤다~~

카드의 테두리와 간격은 같지만 내부 콘텐츠가 달라진다면,

**slot이 적합하다**. 

```vue
<!-- BaseCard.vue -->
<template>
  <article class="card">
    <header><slot name="header" /></header>
    <div><slot /></div>
  </article>
</template>
```

```vue
<!-- 부모 컴포넌트 -->
<BaseCard>
  <template #header>
    <h2>서울 날씨</h2>
  </template>

  <p>현재 기온은 28도입니다.</p>
</BaseCard>
```

## 상태는 어디에 둘까?

가장 중요한 기준은 **상태를 실제로 필요한 범위 중 가장 작은 곳에 두는 것**

| 상황 | 우선 선택 |
| --- | --- |
| 한 컴포넌트만 사용하는 상태 | `ref`, `reactive` |
| 부모와 자식이 함께 사용하는 상태 | 부모가 소유하고 `props` / `emit` 사용 |
| 여러 컴포넌트에서 같은 로직을 재사용 | composable |
| 가까운 하위 트리에 공통 의존성을 제공 | `provide` / `inject` |
| 멀리 떨어진 화면이 같은 상태를 공유 | Pinia |

드롭다운 열림 여부, 입력 중인 값, hover 상태처럼 해당 컴포넌트가 사라질 때 함께 없어져도 되는 값은 전역 저장소에 둘 이유가 없다.

```js
const isDropdownOpen = ref(false)
const inputValue = ref('')
```

반대로 로그인 사용자나 장바구니처럼 서로 먼 화면이 함께 읽고 바꾸는 상태는 Pinia 같은 저장소가 유용하다.

## composable로 로직 재사용하기

UI가 아니라 상태와 동작이 반복된다면 컴포넌트를 복사하지 말고 composable로 분리

```js
// composables/useToggle.js
import { ref } from 'vue'

export function useToggle(initialValue = false) {
  const value = ref(initialValue)

  const toggle = () => {
    value.value = !value.value
  }

  return { value, toggle }
}
```

```vue
<script setup>
import { useToggle } from './composables/useToggle'

const { value: isOpen, toggle } = useToggle()
</script>
```

## 컴포넌트 생명주기

컴포넌트는 설정되고, DOM에 연결되고, 상태 변경에 따라 갱신된 뒤 제거된다.

| 단계 | 대표 훅 | 자주 하는 작업 |
| --- | --- | --- |
| 마운트 전후 | `onBeforeMount`, `onMounted` | DOM 접근, 브라우저 API 연결 |
| 업데이트 전후 | `onBeforeUpdate`, `onUpdated` | 갱신된 DOM 측정 |
| 언마운트 전후 | `onBeforeUnmount`, `onUnmounted` | 타이머와 이벤트 리스너 정리 |

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

`onMounted()`에서 등록한 외부 이벤트와 타이머는 `onUnmounted()`에서 해제한다. 단순한 파생 값은 `onUpdated()`보다 `computed()`로 표현하는 편이 명확하다.

## 설계 점검표

컴포넌트를 나눌 때 아래 질문을 확인하자

1. 이 컴포넌트의 책임을 한 문장으로 설명할 수 있는가?
2. 입력은 props, 출력은 emit으로 드러나는가?
3. props를 자식에서 직접 수정하고 있지는 않은가?
4. 반복되는 UI는 컴포넌트, 반복되는 로직은 composable로 분리했는가?
5. 지역 상태를 불필요하게 Pinia로 올리지 않았는가?
6. 외부 이벤트와 타이머를 언마운트 시점에 정리하는가?

컴포넌트 설계의 목표는 파일 수를 늘리는 것이 아니다. 상태의 소유자와 컴포넌트 사이의 계약을 분명하게 만드는 것이다.

## 참고 자료

- [Vue 공식 문서: Components Basics](https://vuejs.org/guide/essentials/component-basics.html)
- [Vue 공식 문서: Component Events](https://vuejs.org/guide/components/events.html)
- [Vue 공식 문서: Slots](https://vuejs.org/guide/components/slots.html)
- [Vue 공식 문서: Lifecycle Hooks](https://vuejs.org/guide/essentials/lifecycle.html)

---
