import { Result } from "cubus";
import R from "ramda";
import * as Debug from "../debug";

Debug.on();

// TODO: More than 2 Dimensions (in this case years)
export default class Aggregator {

    private operation: string;
    private defaultValue = R.curry((defaultNum: number, num: number) => isNaN(num) ? defaultNum : num);
    private rejectNaNs  = R.filter((result: Result<number>) => !isNaN(result.value));
    private toValues = R.map((result: Result<number>) => result.value);

    constructor(operation: string) {
        this.operation = operation;
    }

    public aggregate(data: Array<Result<number>>): number {
       if (this.operation === "Summe" ) {
           return this.sum(data);
       }
       if (this.operation === "Anzahl" ) {
         return data.length;
       }
       if (this.operation === "Mittelwert" ) {
          return this.mean(data);
       }
       if (this.operation === "Medianwert" ) {
        return this.median(data);
       }
       if (this.operation === "Minimum" ) {
        return this.min(data);
       }
       if (this.operation === "Maximum" ) {
        return this.max(data);
       }
       return data.length;
    }

    private sum(data: Array<Result<number>>) {
        const values = R.map((result) => this.defaultValue(0, result.value), data);
        return R.sum(values);
    }

    private mean(data: Array<Result<number>>) {
        return R.mean(this.toValues(this.rejectNaNs(data)));
    }

    private median(data: Array<Result<number>>) {
        return R.median(this.toValues(this.rejectNaNs(data)));
    }

    private min(data: Array<Result<number>>) {
        const values = this.toValues(this.rejectNaNs(data));
        return R.reduce(R.min, Number.MAX_VALUE, values);
    }

    private max(data: Array<Result<number>>) {
        const values = this.toValues(this.rejectNaNs(data));
        return R.reduce(R.max, Number.MIN_VALUE, values);
    }
}
