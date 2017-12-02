- Asynchronous Guards (promise && callback)
- Guards to work on nested objects:
```ts
import { applyGuards, hidden } from 'bindable/Guards';
const model = { private: { someStuff: { counter: 0 } } };
applyGuards(model, 'private', hidden);
model.private.someStuff.counter++;
```