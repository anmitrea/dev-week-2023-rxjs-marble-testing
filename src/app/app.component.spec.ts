import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {
  defer,
  filter,
  from,
  map,
  Observable,
  of,
  skip,
  Subject,
  Subscriber,
  timer
} from "rxjs";
import {cold, hot} from 'jest-marbles';
import {TestScheduler} from "rxjs/internal/testing/TestScheduler";

describe('AppComponent', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent]
    });

    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  describe('1 - Observable Creation', ()=> {
    test('', (done) => {
      const expectedValues = ['Hello!', 'I am an observable.'];
      let idx = 0;

      const myObservable: Observable<string> = new Observable((observer: Subscriber<string>) => {
        observer.next('Hello!');
        observer.next('I am an observable.');
        observer.complete();
      });

      myObservable.subscribe({
        next: (value: string) => {
          expect(value).toBe(expectedValues[idx]);
          idx++;
        },
        complete: () => {
          expect(idx).toBe(expectedValues.length);
          done(); // important!
        },
      });
    });
  });

  describe('2 - Observable Testing', () => {
    test('a) Subscribe & Assert Pattern', (done) => {
      const expectedValues: string[] = ['firstValue', 'secondValue', 'thirdValue'];
      let idx = 0;

      const source$: Observable<string> = of('firstValue', 'secondValue', 'thirdValue');

      source$.subscribe({
        next: (value: string) => {
          expect(value).toBe(expectedValues[idx]);
          idx++;
        },
        complete: () => {
          expect(idx).toBe(expectedValues.length);
          done(); // important!
        }
      });
    });

    test('b) Marble Testing', () => {
      const expectedValues = ['firstValue', 'secondValue', 'thirdValue'];
      let idx = 0;

      const source$ = cold('a-b-c|', {
        a: expectedValues[0],
        b: expectedValues[1],
        c: expectedValues[2],
      });

      source$.subscribe({
        next: (value: string) => {
          expect(value).toBe(expectedValues[idx]);
          idx++;
        },
        complete: () => {
          expect(idx).toBe(expectedValues.length);
        },
      });
    });
  });

  describe('5 - a) Cold Observable', () => {
    test('Simple Cold Observable', () => {
      const source$: Observable<number> = new Observable((observer) => {
        // [!] data is produced inside the observable
        observer.next(Math.random());
      });

      source$.subscribe((data: number) => {
        console.log(data);
      });

      source$.subscribe((data: number) => {
        console.log(data);
      });
    });

    test('Equivalent using Defer() and Cold() - new observable for each subscribe', () => {
      const source$: Observable<number> = defer(() => cold('a|', { a: Math.random() }));

      source$.subscribe((data: number) => {
        console.log(data);
      });

      source$.subscribe((data: number) => {
        console.log(data);
      });
    });

    test('Observable with Error and Filter Operator', () => {
      const sourceValues = { a: 'apples', b: 'bananas', c: 'cherries' };
      const source$ = cold('-a-b-c-#', sourceValues, 'oops! error...');

      const result$ = source$.pipe(
        filter(value => value !== 'bananas')
      );

      const expectedValues = { a: 'apples', c: 'cherries' };
      const expected$ = cold('-a---c-#', expectedValues, 'oops! error...');

      expect(result$).toBeObservable(expected$);
    });
  });

  describe('5 - b) Hot Observable', () => {
    test('Simple Hot Observable', () => {
      const random = Math.random();

      const source$: Observable<number> = new Observable((observer) => {
        // [!] data is produced outside the observable
        observer.next(random);
      });

      source$.subscribe((data: number) => {
        console.log(data);
      });

      source$.subscribe((data: number) => {
        console.log(data);
      });
    });

    test('Equivalent using Hot()', () => {
      const source$: Observable<number> = hot('a|', { a: Math.random() });

      source$.subscribe((data: number) => {
        console.log(data);
      });

      source$.subscribe((data: number) => {
        console.log(data);
      });
    });

    test('Subject', () => {
      const subject = new Subject<string>();
      const values: string[] = [];
      const expectedValues = ['A', 'B', 'C'];

      const subscription = subject.subscribe(value => {
        values.push(value);
      });

      subject.next('A');
      subject.next('B');
      subject.next('C');

      subscription.unsubscribe();

      expect(values).toEqual(expectedValues);
    });

    test('Hot Observable with Map Operator', () => {
      const sourceMarbles = '--a--b--c--|';
      const expectedMarbles = '--A--B--C--|';

      const source$ = hot(sourceMarbles);
      const expected$ = hot(expectedMarbles);

      const mapped$ = source$.pipe(map(value => value.toUpperCase()));

      expect(mapped$).toBeObservable(expected$);
    });

    it('Hot Observable with Caret symbol', () => {
      const sourceMarbles = '--a-^-b---c--d--e--|';
      const expectedMarbles = '--B---C-----E--|';

      const source$ = hot(sourceMarbles);

      const mapped$ = source$.pipe(
        map(value => value.toUpperCase()),
        filter(value => value !== 'A' && value !== 'D')
      );

      const expected$ = hot(expectedMarbles);

      expect(mapped$).toBeObservable(expected$);
    });
  });

  describe('RxJS Common Operators', ()=> {
    describe('Transformation Operators', () => {
      test('map - Transforming values', () => {
        const source$ = cold('a-b-c-|');
        const expected$ = cold('A-B-C-|', { A: 'a+', B: 'b+', C: 'c+' });

        const result$ = source$.pipe(map(value => value + '+'));

        expect(result$).toBeObservable(expected$);
      });

      test('map - Transforming values with hot observable', () => {
        const source$ = hot('--a--b--c-|', { a: { value: 1 }, b: { value: 2 }, c: { value: 3 } });
        const expected$ = hot('--x--y--z-|', { x: { value: 2 }, y: { value: 4 }, z: { value: 6 } });

        const result = source$.pipe(
          map(obj => ({ value: obj.value * 2 }))
        );

        expect(result).toBeObservable(expected$);
      });
    });

    describe('Filtering Operators', () => {
      test('filter - Filtering values', () => {
        const source$ = cold('a-b-c-|');
        const expected$ = cold('--b---|');

        const result$ = source$.pipe(filter(value => value === 'b'));

        expect(result$).toBeObservable(expected$);
      });

      test('filter - Filtering values with hot observable', () => {
        const source$ = hot('a-b-c-d-#', { a: 'dog', b: 'cat', c: 'mouse', d: 'date' }, 'oops! error...');
        const expected$ = hot('------d-#', { d: 'date' }, 'oops! error...');

        const result$ = source$.pipe(filter(value => value === 'date'));

        expect(result$).toBeObservable(expected$);
      });

      test('skip - Skipping the first N values', () => {
        const source$ = cold('a-(bc)-d-|');
        const expected$ = cold('--(bc)-d-|');

        const result$ = source$.pipe(skip(1));

        expect(result$).toBeObservable(expected$);
      });
    });

    describe('Creation Operators', () => {
      test('from - Creating an observable from an array', () => {
        const sourceArray = ['a', 'b', 'c'];
        const expected$ = cold('(abc|)');

        const result$ = from(sourceArray);

        expect(result$).toBeObservable(expected$);
      });
    });
  });


  describe('6) TestScheduler', () => {
    const fetchServerData = (): Observable<string> => {
      return timer(1000).pipe(
        map(() => 'Data from the server')
      );
    };

    // [!] test runs for 6 ms
    test('Wait for 1000ms and then emit data', () => {
      scheduler.run(({ expectObservable }) => {
        const expectedData = 'Data from the server';
        const source$ = fetchServerData();

        expectObservable(source$).toBe('1000ms (a|)', { a: expectedData });
      });
    });

    // [!] test runs for 1.10 seconds
    test('Equivalent - Wait for 1000ms and then emit data', (done)=> {
      const expectedData = 'Data from the server';
      const source$ = fetchServerData();

      source$.subscribe((data: string) => {
        expect(data).toBe(expectedData);
        done();
      });
    });
  });
});
