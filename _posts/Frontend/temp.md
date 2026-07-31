# Vue 파일의 기본 구조와 템플릿 문법

## 1. Vue 파일의 기본 구조

Vue에서는 날씨 카드 예제를 통해 데이터, 함수, 화면 템플릿, 스타일이 어떻게 연결되는지 확인할 수 있다.

~~~vue
<script setup>
import { ref } from 'vue'

// 날씨 데이터
const weatherList = ref([
  {
    id: 'city_01',
    name: '서울',
    temp: 28,
    status: '맑음',
  },
  {
    id: 'city_02',
    name: '수원',
    temp: 24,
    status: '비',
  },
  {
    id: 'city_03',
    name: '부산',
    temp: 26,
    status: '구름',
  },
])

// 선택된 도시 정보
const selectedCityInfo = ref(null)

// 상세보기 버튼
const showDetail = (cityName, status) => {
  window.alert(cityName + '의 현재 날씨는 [' + status + '] 상태입니다.')
}

// 카드 클릭
const selectCity = (city) => {
  selectedCityInfo.value = city
}
</script>

<template>
  <div class="city-container">
    <!-- 날씨 카드 반복 출력 -->
    <div
      v-for="city in weatherList"
      :key="city.id"
      class="weather-card"
      @click="selectCity(city)"
    >
      <h3>{{ city.name }}</h3>

      <p>현재 온도: {{ city.temp }}℃</p>
      <p>날씨: {{ city.status }}</p>

      <!-- 조건부 렌더링 -->
      <p v-if="city.temp >= 25">🔥 더움 (25도 이상)</p>
      <p v-else>❄️ 선선함 (25도 미만)</p>

      <!-- 상세보기 버튼 -->
      <button @click.stop="showDetail(city.name, city.status)">
        상세보기
      </button>
    </div>
  </div>

  <!-- 상태 표시 -->
  <div class="status-bar">
    <p v-if="selectedCityInfo">
      {{ selectedCityInfo.name }}이 선택되었습니다.
    </p>
    <p v-else>도시를 선택해주세요.</p>
  </div>
</template>

<style scoped>
.city-container {
  display: flex;
  gap: 20px;
}

.weather-card {
  border: 1px solid #ddd;
  padding: 20px;
  cursor: pointer;
}

.status-bar {
  margin-top: 20px;
  font-weight: bold;
}
</style>
~~~

### 영역별 역할

| 영역 | 역할 |
| --- | --- |
| script setup | 데이터, 함수, 로직 작성 |
| template | HTML 화면과 Vue 디렉티브 작성 |
| style scoped | 해당 컴포넌트의 CSS 작성 |

## 2. script setup 구조

Vue 컴포넌트의 기본 구조는 다음과 같다.

~~~vue
<script setup>
import { ref } from 'vue'

const weatherList = ref([])

const selectCity = () => {
  // 도시 선택 로직
}
</script>

<template>
  <!-- 화면에 표시할 HTML -->
</template>

<style scoped>
/* 컴포넌트 전용 CSS */
</style>
~~~

script setup 안에서 선언한 변수, 함수, import는 별도의 return 없이 템플릿에서 사용할 수 있다.

~~~vue
<script setup>
const name = '서울'
</script>

<template>
  <h1>{{ name }}</h1>
</template>
~~~

위 코드는 화면에 다음과 같이 표시된다.

~~~html
<h1>서울</h1>
~~~

## 3. import 문법

~~~javascript
import { ref } from 'vue'
~~~

import는 다른 모듈이나 라이브러리에서 필요한 기능을 가져오는 문법이다.

~~~javascript
import { 가져올기능 } from '출처'
~~~

예를 들어 Vue에서 ref, computed, watch를 가져오려면 다음과 같이 작성한다.

~~~javascript
import { ref, computed, watch } from 'vue'
~~~

이 코드는 Vue 라이브러리에서 다음 기능을 가져온다는 의미다.

- ref: 반응형 데이터를 만든다.
- computed: 기존 데이터를 바탕으로 계산된 값을 만든다.
- watch: 데이터 변화를 감시한다.

## 4. ref()와 반응형 데이터

ref()는 Vue에서 반응형 데이터를 만들 때 사용하는 함수다.

~~~javascript
const count = ref(0)

count.value = 10
~~~

ref()로 만든 값은 실제 데이터가 value 안에 저장된다.

~~~text
count
└── value
    └── 0
~~~

값이 변경되면 Vue가 변화를 감지하고 화면을 자동으로 업데이트한다.

~~~text
데이터 변경
    ↓
Vue가 변경 감지
    ↓
화면 자동 업데이트
~~~

## 5. 배열 데이터 구조

날씨 데이터처럼 여러 개의 값을 관리할 때는 배열 안에 객체를 넣어 사용할 수 있다.

~~~javascript
const weatherList = ref([
  {
    id: 'city_01',
    name: '서울',
    temp: 28,
    status: '맑음',
  },
])
~~~

구조를 단순화하면 다음과 같다.

~~~text
weatherList
└── 배열
    ├── 객체
    ├── 객체
    └── 객체
~~~

객체 하나는 키와 값의 쌍으로 구성된다.

~~~javascript
{
  name: '서울',
}
~~~

city.name처럼 작성하면 city 객체의 name 값을 가져올 수 있다.

~~~javascript
const city = {
  name: '서울',
}

console.log(city.name) // 서울
~~~

## 6. 템플릿 문법 {{ }}

Vue에서는 HTML 안에서 JavaScript 값을 출력할 때 이중 중괄호를 사용한다.

~~~vue
<h3>{{ city.name }}</h3>
~~~

city.name의 값이 서울이라면 화면에는 다음과 같이 표시된다.

~~~html
<h3>서울</h3>
~~~

## 7. v-for 반복문

v-for는 배열의 데이터를 반복해서 화면에 출력할 때 사용하는 디렉티브다.

~~~vue
<div
  v-for="city in weatherList"
  :key="city.id"
>
  {{ city.name }}
</div>
~~~

weatherList에 세 개의 도시가 있다면 Vue는 다음과 같이 각각의 카드를 만든다.

~~~javascript
{
  name: '서울',
}

{
  name: '수원',
}

{
  name: '부산',
}
~~~

## 8. :key 문법

반복되는 요소에는 각 항목을 구분할 수 있는 고유한 key를 지정하는 것이 좋다.

~~~vue
:key="city.id"
~~~

앞의 콜론은 v-bind의 축약 문법이다. 따라서 다음 두 코드는 같은 의미다.

~~~vue
:key="city.id"
v-bind:key="city.id"
~~~

## 9. v-if 조건문

v-if와 v-else는 조건에 따라 요소를 표시하거나 숨길 때 사용한다.

~~~vue
<p v-if="city.temp >= 25">
  🔥 더움
</p>

<p v-else>
  ❄️ 선선함
</p>
~~~

JavaScript의 조건문과 비슷한 역할을 한다.

~~~javascript
if (city.temp >= 25) {
  // 더운 날씨 표시
} else {
  // 선선한 날씨 표시
}
~~~

## 10. 이벤트

@click은 요소를 클릭했을 때 함수를 실행하는 이벤트 디렉티브다.

~~~vue
<div @click="selectCity(city)">
  도시 카드
</div>
~~~

위 코드는 JavaScript의 다음 코드와 비슷한 의미다.

~~~javascript
element.onclick = function () {
  selectCity(city)
}
~~~

## 11. 함수와 매개변수

도시 카드를 클릭하면 선택한 도시 객체를 selectCity 함수에 전달한다.

~~~javascript
const selectCity = (city) => {
  selectedCityInfo.value = city
}
~~~

템플릿에서는 다음과 같이 함수를 호출한다.

~~~vue
<div @click="selectCity(city)">
  서울 카드
</div>
~~~

실행 흐름은 다음과 같다.

~~~text
서울 카드 클릭
    ↓
selectCity({ name: '서울', temp: 28 }) 실행
    ↓
selectedCityInfo에 선택된 도시 저장
    ↓
Vue가 상태 변화 감지
    ↓
상태 표시 영역 업데이트
~~~

## 12. 이벤트 수식어 .stop

카드 전체와 카드 안의 버튼에 각각 클릭 이벤트가 있다면 이벤트 버블링이 발생할 수 있다.

~~~text
div 카드 클릭
└── button 클릭
    └── 부모 div 클릭으로 이벤트 전달
~~~

버튼을 클릭했을 때 부모 카드의 클릭 이벤트까지 실행되지 않게 하려면 .stop을 사용한다.

~~~vue
<div @click="selectCity(city)">
  <button @click.stop="showDetail(city.name, city.status)">
    상세보기
  </button>
</div>
~~~

.stop은 이벤트가 부모 요소로 전달되는 것을 중단한다.

## 핵심 정리

| 문법 | 역할 | 예시 |
| --- | --- | --- |
| ref | 화면과 연결되는 반응형 변수 | const data = ref() |
| {{ }} | 데이터를 화면에 출력 | {{ data }} |
| v-for | 목록을 반복 출력 | v-for="item in list" |
| v-if | 조건에 따라 표시 | v-if="조건" |
| @event | 사용자 행동을 함수와 연결 | @click="함수" |
