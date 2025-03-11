/*!*
 *
 *  Copyright (c) Highsoft AS. All rights reserved.
 *
 *!*/
import * as globals from "../globals";
import * as _Highcharts from "../highcharts";
/**
 * Adds the module to the imported Highcharts namespace.
 *
 * @param highcharts
 *        The imported Highcharts namespace to extend.
 */
export function factory(highcharts: typeof Highcharts): void;
declare module "../highcharts" {
    function calculateDirection(): void;
    function getAccelerationFactor(): void;
    function getAccelerationFactorMultiply(): void;
    function getEPMinusPSAR(): void;
    function getExtremePoint(): void;
    function getPSAR(): void;
    function toFixed(): void;
}
export default factory;
export let Highcharts: typeof _Highcharts;
