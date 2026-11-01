export class PriorityQueue<T> {
  private readonly items: T[] = [];
  private readonly comesFirst: (a: T, b: T) => boolean;

  constructor(comesFirst: (a: T, b: T) => boolean) {
    this.comesFirst = comesFirst;
  }

  get size() {
    return this.items.length;
  }

  push(item: T) {
    this.items.push(item);
    let child = this.items.length - 1;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      if (!this.comesFirst(this.items[child], this.items[parent])) break;
      this.swap(child, parent);
      child = parent;
    }
  }

  pop(): T | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length === 0 || last === undefined) return top;
    this.items[0] = last;
    let parent = 0;
    for (;;) {
      const left = parent * 2 + 1;
      const right = left + 1;
      let first = parent;
      if (left < this.items.length && this.comesFirst(this.items[left], this.items[first])) first = left;
      if (right < this.items.length && this.comesFirst(this.items[right], this.items[first])) first = right;
      if (first === parent) return top;
      this.swap(parent, first);
      parent = first;
    }
  }

  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
  }
}
