/* *
 *
 *  Client side exporting module
 *
 *  (c) 2015 Torstein Honsi / Oystein Moseng
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */
'use strict';
import AST from '../../Core/Renderer/HTML/AST.js';
import Chart from '../../Core/Chart/Chart.js';
import D from '../../Core/Defaults.js';
const { defaultOptions } = D;
import DownloadURL from '../DownloadURL.js';
const { downloadURL } = DownloadURL;
import Exporting from '../Exporting/Exporting.js';
import H from '../../Core/Globals.js';
const { doc, win } = H;
import HU from '../../Core/HttpUtilities.js';
const { ajax } = HU;
import OfflineExportingDefaults from './OfflineExportingDefaults.js';
import U from '../../Core/Utilities.js';
const { addEvent, error, extend, fireEvent, merge } = U;
AST.allowedAttributes.push('data-z-index', 'fill-opacity', 'filter', 'rx', 'ry', 'stroke-dasharray', 'stroke-linejoin', 'stroke-opacity', 'text-anchor', 'transform', 'version', 'viewBox', 'visibility', 'xmlns', 'xmlns:xlink');
AST.allowedTags.push('desc', 'clippath', 'g');
/* *
 *
 *  Composition
 *
 * */
var OfflineExporting;
(function (OfflineExporting) {
    /* *
     *
     *  Declarations
     *
     * */
    /* *
     *
     *  Constants
     *
     * */
    // Dummy object so we can reuse our canvas-tools.js without errors
    OfflineExporting.CanVGRenderer = {}, OfflineExporting.domurl = win.URL || win.webkitURL || win, 
    // Milliseconds to defer image load event handlers to offset IE bug
    OfflineExporting.loadEventDeferDelay = H.isMS ? 150 : 0;
    /* *
     *
     *  Functions
     *
     * */
    /* eslint-disable valid-jsdoc */
    /**
     * Extends OfflineExporting with Chart.
     * @private
     */
    function compose(ChartClass) {
        const chartProto = ChartClass.prototype;
        if (!chartProto.exportChartLocal) {
            chartProto.getSVGForLocalExport = getSVGForLocalExport;
            chartProto.exportChartLocal = exportChartLocal;
            // Extend the default options to use the local exporter logic
            merge(true, defaultOptions.exporting, OfflineExportingDefaults);
        }
        return ChartClass;
    }
    OfflineExporting.compose = compose;
    /**
     * Get data URL to an image of an SVG and call download on it options
     * object:
     * - **filename:** Name of resulting downloaded file without extension.
     * Default is `chart`.
     *
     * - **type:** File type of resulting download. Default is `image/png`.
     *
     * - **scale:** Scaling factor of downloaded image compared to source.
     * Default is `1`.
     * - **libURL:** URL pointing to location of dependency scripts to download
     * on demand. Default is the exporting.libURL option of the global
     * Highcharts options pointing to our server.
     *
     * @function Highcharts.downloadSVGLocal
     *
     * @param {string} svg
     * The generated SVG
     *
     * @param {Highcharts.ExportingOptions} options
     * The exporting options
     *
     * @param {Function} failCallback
     * The callback function in case of errors
     *
     * @param {Function} [successCallback]
     * The callback function in case of success
     *
     */
    function downloadSVGLocal(svg, options, failCallback, successCallback) {
        const dummySVGContainer = doc.createElement('div'), imageType = options.type || 'image/png', filename = ((options.filename || 'chart') +
            '.' +
            (imageType === 'image/svg+xml' ?
                'svg' : imageType.split('/')[1])), scale = options.scale || 1;
        let svgurl, blob, finallyHandler, libURL = (options.libURL || defaultOptions.exporting.libURL), objectURLRevoke = true, pdfFont = options.pdfFont;
        // Allow libURL to end with or without fordward slash
        libURL = libURL.slice(-1) !== '/' ? libURL + '/' : libURL;
        /*
         * Detect if we need to load TTF fonts for the PDF, then load them and
         * proceed.
         *
         * @private
         */
        const loadPdfFonts = (svgElement, callback) => {
            const hasNonASCII = (s) => (
            // eslint-disable-next-line no-control-regex
            /[^\u0000-\u007F\u200B]+/.test(s));
            // Register an event in order to add the font once jsPDF is
            // initialized
            const addFont = (variant, base64) => {
                win.jspdf.jsPDF.API.events.push([
                    'initialized',
                    function () {
                        this.addFileToVFS(variant, base64);
                        this.addFont(variant, 'HighchartsFont', variant);
                        if (!this.getFontList().HighchartsFont) {
                            this.setFont('HighchartsFont');
                        }
                    }
                ]);
            };
            // If there are no non-ASCII characters in the SVG, do not use
            // bother downloading the font files
            if (pdfFont && !hasNonASCII(svgElement.textContent || '')) {
                pdfFont = void 0;
            }
            // Add new font if the URL is declared, #6417.
            const variants = ['normal', 'italic', 'bold', 'bolditalic'];
            // Shift the first element off the variants and add as a font.
            // Then asynchronously trigger the next variant until calling the
            // callback when the variants are empty.
            let normalBase64;
            const shiftAndLoadVariant = () => {
                const variant = variants.shift();
                // All variants shifted and possibly loaded, proceed
                if (!variant) {
                    return callback();
                }
                const url = pdfFont && pdfFont[variant];
                if (url) {
                    ajax({
                        url,
                        responseType: 'blob',
                        success: (data, xhr) => {
                            const reader = new FileReader();
                            reader.onloadend = function () {
                                if (typeof this.result === 'string') {
                                    const base64 = this.result.split(',')[1];
                                    addFont(variant, base64);
                                    if (variant === 'normal') {
                                        normalBase64 = base64;
                                    }
                                }
                                shiftAndLoadVariant();
                            };
                            reader.readAsDataURL(xhr.response);
                        },
                        error: shiftAndLoadVariant
                    });
                }
                else {
                    // For other variants, fall back to normal text weight/style
                    if (normalBase64) {
                        addFont(variant, normalBase64);
                    }
                    shiftAndLoadVariant();
                }
            };
            shiftAndLoadVariant();
        };
        /*
         * @private
         */
        const downloadPDF = () => {
            AST.setElementHTML(dummySVGContainer, svg);
            const textElements = dummySVGContainer.getElementsByTagName('text'), 
            // Copy style property to element from parents if it's not
            // there. Searches up hierarchy until it finds prop, or hits the
            // chart container.
            setStylePropertyFromParents = function (el, propName) {
                let curParent = el;
                while (curParent && curParent !== dummySVGContainer) {
                    if (curParent.style[propName]) {
                        let value = curParent.style[propName];
                        if (propName === 'fontSize' && /em$/.test(value)) {
                            value = Math.round(parseFloat(value) * 16) + 'px';
                        }
                        el.style[propName] = value;
                        break;
                    }
                    curParent = curParent.parentNode;
                }
            };
            let titleElements, outlineElements;
            // Workaround for the text styling. Making sure it does pick up
            // settings for parent elements.
            [].forEach.call(textElements, function (el) {
                // Workaround for the text styling. making sure it does pick up
                // the root element
                ['fontFamily', 'fontSize']
                    .forEach((property) => {
                    setStylePropertyFromParents(el, property);
                });
                el.style.fontFamily = pdfFont && pdfFont.normal ?
                    // Custom PDF font
                    'HighchartsFont' :
                    // Generic font (serif, sans-serif etc)
                    String(el.style.fontFamily &&
                        el.style.fontFamily.split(' ').splice(-1));
                // Workaround for plotband with width, removing title from text
                // nodes
                titleElements = el.getElementsByTagName('title');
                [].forEach.call(titleElements, function (titleElement) {
                    el.removeChild(titleElement);
                });
                // Remove all .highcharts-text-outline elements, #17170
                outlineElements =
                    el.getElementsByClassName('highcharts-text-outline');
                while (outlineElements.length > 0) {
                    const outline = outlineElements[0];
                    if (outline.parentNode) {
                        outline.parentNode.removeChild(outline);
                    }
                }
            });
            const svgNode = dummySVGContainer.querySelector('svg');
            if (svgNode) {
                loadPdfFonts(svgNode, () => {
                    svgToPdf(svgNode, 0, scale, (pdfData) => {
                        try {
                            downloadURL(pdfData, filename);
                            if (successCallback) {
                                successCallback();
                            }
                        }
                        catch (e) {
                            failCallback(e);
                        }
                    });
                });
            }
        };
        // Initiate download depending on file type
        if (imageType === 'image/svg+xml') {
            // SVG download. In this case, we want to use Microsoft specific
            // Blob if available
            try {
                if (typeof win.MSBlobBuilder !== 'undefined') {
                    blob = new win.MSBlobBuilder();
                    blob.append(svg);
                    svgurl = blob.getBlob('image/svg+xml');
                }
                else {
                    svgurl = svgToDataUrl(svg);
                }
                downloadURL(svgurl, filename);
                if (successCallback) {
                    successCallback();
                }
            }
            catch (e) {
                failCallback(e);
            }
        }
        else if (imageType === 'application/pdf') {
            if (win.jspdf && win.jspdf.jsPDF) {
                downloadPDF();
            }
            else {
                // Must load pdf libraries first. // Don't destroy the object
                // URL yet since we are doing things asynchronously. A cleaner
                // solution would be nice, but this will do for now.
                objectURLRevoke = true;
                getScript(libURL + 'jspdf.js', function () {
                    getScript(libURL + 'svg2pdf.js', downloadPDF);
                });
            }
        }
        else {
            // PNG/JPEG download - create bitmap from SVG
            svgurl = svgToDataUrl(svg);
            finallyHandler = function () {
                try {
                    OfflineExporting.domurl.revokeObjectURL(svgurl);
                }
                catch (e) {
                    // Ignore
                }
            };
            // First, try to get PNG by rendering on canvas
            imageToDataUrl(svgurl, imageType, {}, scale, function (imageURL) {
                // Success
                try {
                    downloadURL(imageURL, filename);
                    if (successCallback) {
                        successCallback();
                    }
                }
                catch (e) {
                    failCallback(e);
                }
            }, function () {
                if (svg.length > 100000000 /* RegexLimits.svgLimit */) {
                    throw new Error('Input too long');
                }
                // Failed due to tainted canvas
                // Create new and untainted canvas
                const canvas = doc.createElement('canvas'), ctx = canvas.getContext('2d'), matchedImageWidth = svg.match(
                // eslint-disable-next-line max-len
                /^<svg[^>]*\s{,1000}width\s{,1000}=\s{,1000}\"?(\d+)\"?[^>]*>/), matchedImageHeight = svg.match(
                // eslint-disable-next-line max-len
                /^<svg[^>]*\s{0,1000}height\s{,1000}=\s{,1000}\"?(\d+)\"?[^>]*>/);
                if (ctx && matchedImageWidth && matchedImageHeight) {
                    const imageWidth = +matchedImageWidth[1] * scale, imageHeight = +matchedImageHeight[1] * scale, downloadWithCanVG = () => {
                        const v = win.canvg.Canvg.fromString(ctx, svg);
                        v.start();
                        try {
                            downloadURL(win.navigator.msSaveOrOpenBlob ?
                                canvas.msToBlob() :
                                canvas.toDataURL(imageType), filename);
                            if (successCallback) {
                                successCallback();
                            }
                        }
                        catch (e) {
                            failCallback(e);
                        }
                        finally {
                            finallyHandler();
                        }
                    };
                    canvas.width = imageWidth;
                    canvas.height = imageHeight;
                    if (win.canvg) {
                        // Use preloaded canvg
                        downloadWithCanVG();
                    }
                    else {
                        // Must load canVG first.
                        // Don't destroy the object URL yet since we are
                        // doing things asynchronously. A cleaner solution
                        // would be nice, but this will do for now.
                        objectURLRevoke = true;
                        getScript(libURL + 'canvg.js', downloadWithCanVG);
                    }
                }
            }, 
            // No canvas support
            failCallback, 
            // Failed to load image
            failCallback, 
            // Finally
            function () {
                if (objectURLRevoke) {
                    finallyHandler();
                }
            });
        }
    }
    OfflineExporting.downloadSVGLocal = downloadSVGLocal;
    /* eslint-disable valid-jsdoc */
    /**
     * Exporting and offline-exporting modules required. Export a chart to
     * an image locally in the user's browser.
     *
     * @function Highcharts.Chart#exportChartLocal
     *
     * @param  {Highcharts.ExportingOptions} [exportingOptions]
     *         Exporting options, the same as in
     *         {@link Highcharts.Chart#exportChart}.
     *
     * @param  {Highcharts.Options} [chartOptions]
     *         Additional chart options for the exported chart. For example
     *         a different background color can be added here, or
     *         `dataLabels` for export only.
     *
     *
     * @requires modules/exporting
     * @requires modules/offline-exporting
     */
    function exportChartLocal(exportingOptions, chartOptions) {
        const chart = this, options = merge(chart.options.exporting, exportingOptions), fallbackToExportServer = function (err) {
            if (options.fallbackToExportServer === false) {
                if (options.error) {
                    options.error(options, err);
                }
                else {
                    error(28, true); // Fallback disabled
                }
            }
            else {
                chart.exportChart(options);
            }
        }, svgSuccess = function (svg) {
            // If SVG contains foreignObjects PDF fails in all browsers
            // and all exports except SVG will fail in IE, as both CanVG
            // and svg2pdf choke on this. Gracefully fall back.
            if (svg.indexOf('<foreignObject') > -1 &&
                options.type !== 'image/svg+xml' &&
                (H.isMS || options.type === 'application/pdf')) {
                fallbackToExportServer(new Error('Image type not supported for charts with embedded HTML'));
            }
            else {
                OfflineExporting.downloadSVGLocal(svg, extend({ filename: chart.getFilename() }, options), fallbackToExportServer, () => fireEvent(chart, 'exportChartLocalSuccess'));
            }
        }, 
        // Return true if the SVG contains images with external data. With
        // the boost module there are `image` elements with encoded PNGs,
        // these are supported by svg2pdf and should pass (#10243).
        hasExternalImages = function () {
            return [].some.call(chart.container.getElementsByTagName('image'), function (image) {
                const href = image.getAttribute('href');
                return (href !== '' &&
                    typeof href === 'string' &&
                    href.indexOf('data:') !== 0);
            });
        };
        // If we are on IE and in styled mode, add an allowlist to the renderer
        // for inline styles that we want to pass through. There are so many
        // styles by default in IE that we don't want to denylist them all.
        if (H.isMS && chart.styledMode && !Exporting.inlineAllowlist.length) {
            Exporting.inlineAllowlist.push(/^blockSize/, /^border/, /^caretColor/, /^color/, /^columnRule/, /^columnRuleColor/, /^cssFloat/, /^cursor/, /^fill$/, /^fillOpacity/, /^font/, /^inlineSize/, /^length/, /^lineHeight/, /^opacity/, /^outline/, /^parentRule/, /^rx$/, /^ry$/, /^stroke/, /^textAlign/, /^textAnchor/, /^textDecoration/, /^transform/, /^vectorEffect/, /^visibility/, /^x$/, /^y$/);
        }
        // Always fall back on:
        // - MS browsers: Embedded images JPEG/PNG, or any PDF
        // - Embedded images and PDF
        if ((H.isMS &&
            (options.type === 'application/pdf' ||
                chart.container.getElementsByTagName('image').length &&
                    options.type !== 'image/svg+xml')) || (options.type === 'application/pdf' &&
            hasExternalImages())) {
            fallbackToExportServer(new Error('Image type not supported for this chart/browser.'));
            return;
        }
        chart.getSVGForLocalExport(options, chartOptions || {}, fallbackToExportServer, svgSuccess);
    }
    /**
     * Downloads a script and executes a callback when done.
     *
     * @private
     * @function getScript
     * @param {string} scriptLocation
     * @param {Function} callback
     */
    function getScript(scriptLocation, callback) {
        const head = doc.getElementsByTagName('head')[0], script = doc.createElement('script');
        script.type = 'text/javascript';
        script.src = scriptLocation;
        script.onload = callback;
        script.onerror = function () {
            error('Error loading script ' + scriptLocation);
        };
        head.appendChild(script);
    }
    OfflineExporting.getScript = getScript;
    /**
     * Get SVG of chart prepared for client side export. This converts
     * embedded images in the SVG to data URIs. It requires the regular
     * exporting module. The options and chartOptions arguments are passed
     * to the getSVGForExport function.
     *
     * @private
     * @function Highcharts.Chart#getSVGForLocalExport
     * @param {Highcharts.ExportingOptions} options
     * @param {Highcharts.Options} chartOptions
     * @param {Function} failCallback
     * @param {Function} successCallback
     */
    function getSVGForLocalExport(options, chartOptions, failCallback, successCallback) {
        const chart = this, 
        // After grabbing the SVG of the chart's copy container we need
        // to do sanitation on the SVG
        sanitize = (svg) => chart.sanitizeSVG(svg, chartCopyOptions), 
        // When done with last image we have our SVG
        checkDone = () => {
            if (images && imagesEmbedded === imagesLength) {
                successCallback(sanitize(chartCopyContainer.innerHTML));
            }
        }, 
        // Success handler, we converted image to base64!
        embeddedSuccess = (imageURL, imageType, callbackArgs) => {
            ++imagesEmbedded;
            // Change image href in chart copy
            callbackArgs.imageElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageURL);
            checkDone();
        };
        let el, chartCopyContainer, chartCopyOptions, href = null, images, imagesLength = 0, imagesEmbedded = 0;
        // Hook into getSVG to get a copy of the chart copy's
        // container (#8273)
        chart.unbindGetSVG = addEvent(chart, 'getSVG', (e) => {
            chartCopyOptions = e.chartCopy.options;
            chartCopyContainer = e.chartCopy.container.cloneNode(true);
            images = chartCopyContainer && chartCopyContainer
                .getElementsByTagName('image') || [];
            imagesLength = images.length;
        });
        // Trigger hook to get chart copy
        chart.getSVGForExport(options, chartOptions);
        try {
            // If there are no images to embed, the SVG is okay now.
            if (!images || !images.length) {
                // Use SVG of chart copy
                successCallback(sanitize(chartCopyContainer.innerHTML));
                return;
            }
            // Go through the images we want to embed
            for (let i = 0; i < images.length; i++) {
                el = images[i];
                href = el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                if (href) {
                    OfflineExporting.imageToDataUrl(href, 'image/png', { imageElement: el }, options.scale, embeddedSuccess, 
                    // Tainted canvas
                    failCallback, 
                    // No canvas support
                    failCallback, 
                    // Failed to load source
                    failCallback);
                    // Hidden, boosted series have blank href (#10243)
                }
                else {
                    imagesEmbedded++;
                    el.parentNode.removeChild(el);
                    i--;
                    checkDone();
                }
            }
        }
        catch (e) {
            failCallback(e);
        }
        // Clean up
        chart.unbindGetSVG();
    }
    /**
     * Get data:URL from image URL. Pass in callbacks to handle results.
     *
     * @private
     * @function Highcharts.imageToDataUrl
     *
     * @param {string} imageURL
     *
     * @param {string} imageType
     *
     * @param {*} callbackArgs
     *        callbackArgs is used only by callbacks.
     *
     * @param {number} scale
     *
     * @param {Function} successCallback
     *        Receives four arguments: imageURL, imageType, callbackArgs,
     *        and scale.
     *
     * @param {Function} taintedCallback
     *        Receives four arguments: imageURL, imageType, callbackArgs,
     *        and scale.
     *
     * @param {Function} noCanvasSupportCallback
     *        Receives four arguments: imageURL, imageType, callbackArgs,
     *        and scale.
     *
     * @param {Function} failedLoadCallback
     *        Receives four arguments: imageURL, imageType, callbackArgs,
     *        and scale.
     *
     * @param {Function} [finallyCallback]
     *        finallyCallback is always called at the end of the process. All
     *        callbacks receive four arguments: imageURL, imageType,
     *        callbackArgs, and scale.
     */
    function imageToDataUrl(imageURL, imageType, callbackArgs, scale, successCallback, taintedCallback, noCanvasSupportCallback, failedLoadCallback, finallyCallback) {
        let img = new win.Image(), taintedHandler;
        const loadHandler = () => {
            setTimeout(function () {
                const canvas = doc.createElement('canvas'), ctx = canvas.getContext && canvas.getContext('2d');
                let dataURL;
                try {
                    if (!ctx) {
                        noCanvasSupportCallback(imageURL, imageType, callbackArgs, scale);
                    }
                    else {
                        canvas.height = img.height * scale;
                        canvas.width = img.width * scale;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        // Now we try to get the contents of the canvas.
                        try {
                            dataURL = canvas.toDataURL(imageType);
                            successCallback(dataURL, imageType, callbackArgs, scale);
                        }
                        catch (e) {
                            taintedHandler(imageURL, imageType, callbackArgs, scale);
                        }
                    }
                }
                finally {
                    if (finallyCallback) {
                        finallyCallback(imageURL, imageType, callbackArgs, scale);
                    }
                }
                // IE bug where image is not always ready despite calling load
                // event.
            }, OfflineExporting.loadEventDeferDelay);
        }, 
        // Image load failed (e.g. invalid URL)
        errorHandler = () => {
            failedLoadCallback(imageURL, imageType, callbackArgs, scale);
            if (finallyCallback) {
                finallyCallback(imageURL, imageType, callbackArgs, scale);
            }
        };
        // This is called on load if the image drawing to canvas failed with a
        // security error. We retry the drawing with crossOrigin set to
        // Anonymous.
        taintedHandler = () => {
            img = new win.Image();
            taintedHandler = taintedCallback;
            // Must be set prior to loading image source
            img.crossOrigin = 'Anonymous';
            img.onload = loadHandler;
            img.onerror = errorHandler;
            img.src = imageURL;
        };
        img.onload = loadHandler;
        img.onerror = errorHandler;
        img.src = imageURL;
    }
    OfflineExporting.imageToDataUrl = imageToDataUrl;
    /**
     * Get blob URL from SVG code. Falls back to normal data URI.
     *
     * @private
     * @function Highcharts.svgToDataURL
     */
    function svgToDataUrl(svg) {
        // Webkit and not chrome
        const userAgent = win.navigator.userAgent;
        const webKit = (userAgent.indexOf('WebKit') > -1 &&
            userAgent.indexOf('Chrome') < 0);
        try {
            // Safari requires data URI since it doesn't allow navigation to
            // blob URLs. ForeignObjects also don't work well in Blobs in Chrome
            // (#14780).
            if (!webKit && svg.indexOf('<foreignObject') === -1) {
                return OfflineExporting.domurl.createObjectURL(new win.Blob([svg], {
                    type: 'image/svg+xml;charset-utf-16'
                }));
            }
        }
        catch (e) {
            // Ignore
        }
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }
    OfflineExporting.svgToDataUrl = svgToDataUrl;
    /* eslint-disable valid-jsdoc */
    /**
     * @private
     */
    function svgToPdf(svgElement, margin, scale, callback) {
        const width = (Number(svgElement.getAttribute('width')) + 2 * margin) *
            scale, height = (Number(svgElement.getAttribute('height')) + 2 * margin) *
            scale, pdfDoc = new win.jspdf.jsPDF(// eslint-disable-line new-cap
        // setting orientation to portrait if height exceeds width
        height > width ? 'p' : 'l', 'pt', [width, height]);
        // Workaround for #7090, hidden elements were drawn anyway. It comes
        // down to https://github.com/yWorks/svg2pdf.js/issues/28. Check this
        // later.
        [].forEach.call(svgElement.querySelectorAll('*[visibility="hidden"]'), function (node) {
            node.parentNode.removeChild(node);
        });
        // Workaround for #13948, multiple stops in linear gradient set to 0
        // causing error in Acrobat
        const gradients = svgElement.querySelectorAll('linearGradient');
        for (let index = 0; index < gradients.length; index++) {
            const gradient = gradients[index];
            const stops = gradient.querySelectorAll('stop');
            let i = 0;
            while (i < stops.length &&
                stops[i].getAttribute('offset') === '0' &&
                stops[i + 1].getAttribute('offset') === '0') {
                stops[i].remove();
                i++;
            }
        }
        // Workaround for #15135, zero width spaces, which Highcharts uses
        // to break lines, are not correctly rendered in PDF. Replace it
        // with a regular space and offset by some pixels to compensate.
        [].forEach.call(svgElement.querySelectorAll('tspan'), (tspan) => {
            if (tspan.textContent === '\u200B') {
                tspan.textContent = ' ';
                tspan.setAttribute('dx', -5);
            }
        });
        pdfDoc.svg(svgElement, {
            x: 0,
            y: 0,
            width,
            height,
            removeInvalid: true
        }).then(() => callback(pdfDoc.output('datauristring')));
    }
    OfflineExporting.svgToPdf = svgToPdf;
})(OfflineExporting || (OfflineExporting = {}));
/* *
 *
 * Default Export
 *
 * */
export default OfflineExporting;
