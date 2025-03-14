/*!*
 *
 *  Copyright (c) Highsoft AS. All rights reserved.
 *
 *!*/
import * as globals from "../globals.src";
import * as _Highcharts from "../highcharts.src";
/**
 * Adds the module to the imported Highcharts namespace.
 *
 * @param highcharts
 *        The imported Highcharts namespace to extend.
 */
export function factory(highcharts: typeof Highcharts): void;
declare module "../highcharts.src" {
    interface BorderRadiusOptionsObject {
        radius: (number|string);
        scope: ("point"|"stack");
        where: ("all"|"end");
    }
}
export default factory;
export let Highcharts: typeof _Highcharts;
