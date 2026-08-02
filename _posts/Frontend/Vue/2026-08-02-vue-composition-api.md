---
layout: post
title: "Vue Composition API 정리"
date: 2026-08-02 09:00:00 +0900
categories: [Frontend, Vue]
tags: [Frontend, Vue.js, Composition API, ref, reactive, computed, watch]
description: "Vue Composition API의 기본 개념과 ref, reactive, computed, watch, watchEffect의 사용 방법을 정리한다."
summary: "Composition API는 컴포넌트의 상태와 로직을 기능별로 모아 작성하는 Vue 3의 코드 작성 방식이다."
key_concepts:
  - "ref와 reactive로 반응형 상태를 만든다."
  - "computed는 상태에서 파생된 값을 계산하고, watch는 변경 후 작업을 처리한다."
  - "watchEffect는 함수 내부에서 사용하는 반응형 값을 자동으로 추적한다."
strengths:
  - "기능 단위로 상태와 함수를 묶어 큰 컴포넌트도 정리하기 좋다."
  - "재사용할 로직을 composable로 분리하기 쉽다."
tradeoffs:
  - "반응성 연결과 실행 시점을 이해하지 않으면 코드 흐름이 복잡해질 수 있다."
  - "Options API보다 자유로운 만큼 팀의 작성 규칙이 필요하다."
---

{% raw %}

## Composition API란?

자자, 이번에는 Vue의 **Composition API**를 정리해보자.

Vue 컴포넌트에는 보통 다음과 같은 로직이 들어간다.

- 화면에서 사용하는 상태
- 상태를 변경하는 함수
- 상태에서 계산되는 값
- 서버 요청이나 이벤트 감시
- 컴포넌트 생명주기에 맞춰 실행할 작업

Composition API는 이런 로직을 옵션별로 흩어놓기보다, 기능 단위로 가까이 모아서 작성하는 방식이다. 그래서 컴포넌트가 커질수록 어떤 상태와 함수가 한 기능을 이루는지 파악하기 쉬워진다.

<!--more-->

Vue 3에서는 `<script setup>`과 함께 Composition API를 많이 사용한다.

```vue
<script setup>
import { computed, ref } from 'vue'

const count = ref(0)

const doubleCount = computed(() => {
  return count.value * 2
})

const increase = () => {
  count.value++
}
</script>

<template>
  <p>현재 값: {{ count }}</p>
  <p>두 배 값: {{ doubleCount }}</p>
  <button @click="increase">증가</button>
</template>
```

이 코드에서는 `count` 상태, `doubleCount` 계산값, `increase` 함수가 한곳에 모여 있다. 화면과 연결되는 템플릿도 아래에서 바로 확인할 수 있다.

## Composition API에서 자주 쓰는 함수

처음부터 모든 함수를 외울 필요는 없다. 우선 아래 함수들의 역할을 구분하면 된다.

| 분류 | 주요 함수 | 역할 |
| --- | --- | --- |
| 반응형 상태 | `ref`, `reactive` | 변경을 추적하는 상태를 만든다. |
| 계산과 감시 | `computed`, `watch`, `watchEffect` | 상태에서 값을 계산하거나 변경 후 작업을 실행한다. |
| 생명주기 | `onMounted`, `onUpdated`, `onUnmounted` | 컴포넌트의 생성·수정·제거 시점에 코드를 실행한다. |
| 컴포넌트 통신 | `defineProps`, `defineEmits` | 부모와 자식 컴포넌트 사이의 데이터를 연결한다. |
| 반응성 변환 | `toRef`, `toRefs`, `unref` | 반응형 객체의 속성을 ref로 연결하거나 값을 꺼낸다. |
| 의존성 주입 | `provide`, `inject` | 깊은 컴포넌트 트리에서 값을 공유한다. |
| DOM·렌더링 | `nextTick`, `h` | DOM 반영 시점을 기다리거나 렌더링을 직접 제어한다. |

이번 글에서는 그중에서도 `ref`, `reactive`, `computed`, `watch`, `watchEffect`를 중심으로 살펴보자.

## `ref()`로 반응형 상태 만들기

`ref()`는 원시 값과 객체·배열을 반응형 상태로 감싸는 함수다.

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
const name = ref('홍길동')
const isActive = ref(true)
const items = ref(['사과', '배'])
const user = ref({
  name: '이순신',
  age: 30
})

const increase = () => {
  count.value++
}

const changeUserName = () => {
  user.value.name = '장보고'
}
</script>

<template>
  <p>카운트: {{ count }}</p>
  <p>이름: <input v-model="name" /></p>
  <p>활성 상태: {{ isActive ? '활성' : '비활성' }}</p>
  <p>과일 목록: {{ items.join(', ') }}</p>
  <p>사용자: {{ user.name }} / {{ user.age }}세</p>

  <button @click="increase">카운트 증가</button>
  <button @click="isActive = !isActive">상태 토글</button>
  <button @click="items.push('귤')">과일 추가</button>
  <button @click="changeUserName">이름 변경</button>
</template>
```

`<script setup>` 안의 JavaScript에서는 `.value`를 사용하고, 템플릿에서는 Vue가 자동으로 언래핑해주므로 `.value`를 생략한다.

```js
const count = ref(0)

// JavaScript
count.value++
console.log(count.value)
```

```vue
<!-- template -->
<p>{{ count }}</p>
```

### `ref`를 사용할 때 기억할 점

- `ref`를 사용하려면 `vue`에서 import해야 한다.
- JavaScript에서 값을 읽거나 변경할 때는 `.value`를 사용한다.
- 템플릿에서는 `.value`를 생략한다.
- 객체나 배열을 `ref`로 만들면 내부 값에도 반응성이 연결된다.

## `reactive()`로 객체와 배열 다루기

`reactive()`는 객체나 배열 자체를 반응형 객체로 만든다. `ref`와 달리 `.value` 없이 속성에 접근한다.

```vue
<script setup>
import { reactive } from 'vue'

const user = reactive({
  name: '이순신',
  age: 30
})

const items = reactive(['사과', '바나나'])

const celebrate = () => {
  user.age++
}

const addItem = () => {
  items.push(`과일 ${items.length + 1}`)
}

const removeItem = (index) => {
  items.splice(index, 1)
}
</script>

<template>
  <p>{{ user.name }} / {{ user.age }}세</p>
  <button @click="celebrate">나이 한 살 추가</button>

  <ul>
    <li v-for="(item, index) in items" :key="item">
      {{ item }}
      <button @click="removeItem(index)">삭제</button>
    </li>
  </ul>
  <button @click="addItem">과일 추가</button>
</template>
```

### `reactive`의 주의점

반응형으로 만든 객체를 통째로 다른 객체로 교체하면 기존 반응성 연결이 끊긴다.

```js
let state = reactive({ count: 0 })

// 잘못된 사용: 반응형 객체 자체를 교체함
state = { count: 5 }

// 올바른 사용: 기존 객체의 속성을 변경함
state.count = 5
```

객체를 통째로 교체해야 하거나 `.value`를 사용하는 방식이 더 명확하다 싶으면 `ref`를 선택하면 된다. 무조건 어느 한쪽이 정답이라기보다는 데이터의 형태와 팀의 작성 규칙에 맞춰 선택하는 것이 중요하다.

### `ref`와 `reactive` 비교

| 구분 | `ref` | `reactive` |
| --- | --- | --- |
| 대상 | 원시 값, 객체, 배열 | 객체, 배열, Map, Set |
| JavaScript 접근 | `.value` 필요 | 속성에 바로 접근 |
| 객체 교체 | `.value = 새 객체`로 가능 | 연결이 끊길 수 있음 |
| 사용 예 | 단일 값, 교체 가능한 상태 | 여러 속성을 묶은 객체 |

### 반응성 연결을 유지하는 보조 함수

`reactive` 객체를 구조 분해하면 반응성 연결이 끊길 수 있다. 이때 `toRef`나 `toRefs`를 사용하면 원본 객체와 연결된 ref를 만들 수 있다.

```js
import { reactive, toRefs } from 'vue'

const state = reactive({
  name: '홍길동',
  age: 20
})

const { name, age } = toRefs(state)

age.value++
// state.age도 함께 변경됨
```

그 밖의 반응성 보조 함수는 필요할 때 찾아서 사용하면 된다.

| 함수 | 역할 |
| --- | --- |
| `readonly` | 반응형 값을 읽기 전용으로 만든다. |
| `shallowRef` | 최상위 ref 값의 변경만 추적한다. |
| `shallowReactive` | 객체의 최상위 속성만 반응형으로 만든다. |
| `unref` | ref라면 `.value`, 일반 값이면 원래 값을 반환한다. |
| `toRaw` | 반응형 프록시의 원본 객체를 가져온다. |
| `markRaw` | 특정 객체가 반응형으로 변환되지 않게 한다. |
| `isRef`, `isReactive`, `isReadonly` | 반응형 여부를 확인한다. |

## `computed()`로 계산된 값 만들기

`computed()`는 기존 반응형 상태를 바탕으로 새로운 값을 계산한다. 계산에 사용한 의존성이 변경될 때 다시 계산하고, 같은 값이 필요할 때는 이전 결과를 재사용한다.

```vue
<script setup>
import { computed, ref } from 'vue'

const count = ref(0)
const dummy = ref(0)

const doubleCount = computed(() => {
  return count.value * 2
})

const increaseCount = () => {
  count.value++
}

const increaseDummy = () => {
  dummy.value++
}
</script>

<template>
  <p>count: {{ count }}</p>
  <p>dummy: {{ dummy }}</p>
  <p>두 배 값: {{ doubleCount }}</p>

  <button @click="increaseCount">count 증가</button>
  <button @click="increaseDummy">dummy 증가</button>
</template>
```

`dummy`가 변경되어 컴포넌트가 다시 렌더링되어도 `doubleCount`의 계산에 `dummy`가 사용되지 않았다면 다시 계산할 필요가 없다. 이것이 일반 함수와 `computed`의 중요한 차이다.

```js
const totalPrice = computed(() => {
  return products.value.reduce((sum, product) => {
    return sum + product.price
  }, 0)
})
```

`computed`는 계산된 값이므로 템플릿에서 함수처럼 호출하지 않는다.

```vue
<!-- 올바른 사용 -->
<p>총가격: {{ totalPrice }}원</p>

<!-- 잘못된 사용 -->
<button @click="totalPrice(products)">총가격</button>
```

### 일반 함수와 `computed` 구분

```js
// 사용자 행동을 처리하는 일반 함수
const save = () => {
  alert('저장되었습니다.')
}

// 상태에서 값을 계산하는 computed
const completedCount = computed(() => {
  return todos.value.filter((todo) => todo.done).length
})
```

```text
사용자가 행동한다 → 일반 함수
상태에서 값이 나온다 → computed
```

## `watch()`로 변경 후 작업 실행하기

`watch()`는 특정 반응형 값의 변경을 감시하고, 값이 바뀐 뒤 후속 작업을 실행한다.

- 서버 요청
- 로컬 스토리지 저장
- 로그 기록
- 다른 상태 변경
- 외부 라이브러리와 동기화

```vue
<script setup>
import { ref, watch } from 'vue'

const currentCity = ref('서울')
const logMessage = ref('아직 감시 시스템이 작동하지 않았습니다.')

watch(currentCity, (newValue, oldValue) => {
  logMessage.value = `${oldValue}에서 ${newValue}(으)로 변경됨.`
  console.log(`${newValue}의 날씨 API를 다시 조회합니다.`)
})
</script>

<template>
  <p>현재 도시: {{ currentCity }}</p>
  <button @click="currentCity = '서울'">서울</button>
  <button @click="currentCity = '수원'">수원</button>
  <button @click="currentCity = '부산'">부산</button>
  <p>{{ logMessage }}</p>
</template>
```

콜백에는 새 값과 이전 값이 순서대로 전달된다.

### 여러 값 감시하기

첫 번째 인자에 감시할 ref를 배열로 전달하면 여러 값을 한 번에 감시할 수 있다.

```js
import { ref, watch } from 'vue'

const city = ref('서울')
const dateType = ref('오늘')
const apiStatus = ref('대기 중...')

watch(
  [city, dateType],
  ([newCity, newDate], [oldCity, oldDate]) => {
    apiStatus.value = `${oldCity}(${oldDate}) → ${newCity}(${newDate})`
  }
)
```

감시 대상 배열의 순서와 콜백의 새 값·이전 값 배열 순서는 서로 대응한다.

### 객체와 배열 깊이 감시하기

객체나 배열 내부의 변경까지 감시하려면 `deep: true`를 사용할 수 있다.

```js
import { ref, watch } from 'vue'

const user = ref({
  name: '홍길동',
  age: 20
})

watch(
  user,
  (newUser) => {
    console.log(`현재 이름: ${newUser.name}`)
  },
  { deep: true }
)
```

다만 깊은 감시는 객체 전체를 재귀적으로 확인하므로 꼭 필요한 경우에 사용하는 것이 좋다. 내부 속성의 변경을 감시하면서 이전 값도 정확하게 비교하고 싶다면 특정 속성만 감시한다.

```js
watch(
  () => user.value.age,
  (newAge, oldAge) => {
    console.log(`${oldAge}세에서 ${newAge}세로 변경됨.`)
  }
)
```

`reactive` 객체 자체를 감시하면 내부 변경을 감지할 수 있지만, 중첩 속성 변경에서는 새 값과 이전 값이 같은 객체를 가리킬 수 있다. 이전 값 비교가 필요하면 위처럼 감시할 속성을 함수로 지정하는 편이 명확하다.

## `watchEffect()`로 자동 감시하기

`watchEffect()`는 감시할 대상을 따로 적지 않는다. 함수 내부에서 사용하는 반응형 값을 자동으로 추적하고, 값이 변경될 때 다시 실행한다.

- 컴포넌트가 처음 생성될 때 즉시 한 번 실행된다.
- 함수 내부에서 읽은 반응형 값만 추적한다.
- `oldValue`를 제공하지 않는다.
- 이전 값과 비교해야 하면 `watch`를 사용한다.

```js
import { ref, watchEffect } from 'vue'

const city = ref('서울')
const message = ref('')

watchEffect(() => {
  message.value = `${city.value}의 날씨를 조회합니다.`
})
```

### `watch`, `watchEffect` 비교

| 구분 | `watch` | `watchEffect` |
| --- | --- | --- |
| 감시 대상 | 직접 지정 | 함수 안에서 자동 추적 |
| 최초 실행 | 기본적으로 변경 후 실행 | 생성 직후 즉시 실행 |
| 이전 값 | 제공 | 제공하지 않음 |
| 적합한 상황 | 특정 값의 변경 전후 비교 | 여러 의존성을 간단히 동기화 |

DOM 업데이트가 끝난 뒤 실행해야 하면 `watchPostEffect`, 값이 바뀌는 즉시 동기적으로 실행해야 하면 `watchSyncEffect`를 검토할 수 있다. 다만 실행 타이밍을 세밀하게 제어해야 하는 경우에만 사용하자.

## 생명주기 훅 맛보기

Composition API에서는 컴포넌트의 생명주기 훅도 함수로 사용한다.

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

- `onMounted`: 컴포넌트가 DOM에 마운트된 뒤 실행한다.
- `onUpdated`: 반응형 상태 변경으로 업데이트된 뒤 실행한다.
- `onUnmounted`: 컴포넌트가 제거된 뒤 실행한다. 이벤트 리스너나 타이머 정리에 사용한다.

특히 `onMounted`에서 등록한 이벤트나 타이머는 `onUnmounted`에서 정리하는 습관을 들이는 것이 좋다.

## Composition API를 composable로 확장하기

Composition API의 장점은 반복되는 로직을 함수로 분리해 여러 컴포넌트에서 재사용할 수 있다는 점이다. 이런 재사용 함수를 보통 **composable**이라고 부른다.

```js
// useCounter.js
import { computed, ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const doubleCount = computed(() => count.value * 2)

  const increase = () => {
    count.value++
  }

  const reset = () => {
    count.value = initialValue
  }

  return {
    count,
    doubleCount,
    increase,
    reset
  }
}
```

```vue
<script setup>
import { useCounter } from './useCounter'

const { count, doubleCount, increase, reset } = useCounter(10)
</script>

<template>
  <p>{{ count }} / {{ doubleCount }}</p>
  <button @click="increase">증가</button>
  <button @click="reset">초기화</button>
</template>
```

상태와 함수가 특정 기능을 중심으로 묶여 있으니, 컴포넌트가 커져도 로직을 분리해서 관리할 수 있다. 나중에 `useFetch`, `useTodo`, `useAuth` 같은 형태로 확장하는 흐름이다.

## 최종 정리

Composition API는 단순히 함수 몇 개를 새로 사용하는 문법이 아니다. 컴포넌트의 로직을 기능 단위로 구성하고, 필요한 반응형 흐름을 조합하는 방식이다.

```text
ref / reactive
      ↓
반응형 상태 생성
      ↓
computed로 파생 값 계산
      ↓
watch 또는 watchEffect로 변경 감지
      ↓
함수와 템플릿으로 화면 연결
      ↓
composable로 재사용
```

기억할 것만 다시 적어보자.

1. `ref`는 원시 값과 객체·배열을 반응형으로 만든다.
2. `reactive`는 객체나 배열 자체를 반응형으로 만든다.
3. JavaScript에서 `ref`는 `.value`, 템플릿에서는 `.value`를 생략한다.
4. `computed`는 상태에서 파생된 값을 계산한다.
5. `watch`는 특정 값의 변경 후 작업을 실행한다.
6. `watchEffect`는 함수 내부에서 사용하는 반응형 값을 자동으로 추적한다.
7. `onUnmounted`에서 이벤트와 타이머를 정리한다.
8. 반복되는 로직은 composable로 분리한다.

처음에는 `ref`, `computed`, `watch`만으로도 충분하다. 나머지는 실제로 필요한 상황이 왔을 때 하나씩 살펴보면 된다. 현업에 가서 빨리 써보고 싶다. 일단은 여기까지!

{% endraw %}
