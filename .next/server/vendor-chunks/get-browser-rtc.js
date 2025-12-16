/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/get-browser-rtc";
exports.ids = ["vendor-chunks/get-browser-rtc"];
exports.modules = {

/***/ "(ssr)/./node_modules/get-browser-rtc/index.js":
/*!***********************************************!*\
  !*** ./node_modules/get-browser-rtc/index.js ***!
  \***********************************************/
/***/ ((module) => {

eval("// originally pulled out of simple-peer\nmodule.exports = function getBrowserRTC() {\n    if (typeof globalThis === \"undefined\") return null;\n    var wrtc = {\n        RTCPeerConnection: globalThis.RTCPeerConnection || globalThis.mozRTCPeerConnection || globalThis.webkitRTCPeerConnection,\n        RTCSessionDescription: globalThis.RTCSessionDescription || globalThis.mozRTCSessionDescription || globalThis.webkitRTCSessionDescription,\n        RTCIceCandidate: globalThis.RTCIceCandidate || globalThis.mozRTCIceCandidate || globalThis.webkitRTCIceCandidate\n    };\n    if (!wrtc.RTCPeerConnection) return null;\n    return wrtc;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly93aGF0c2FwcC1jbG9uZS1mcm9udGVuZC8uL25vZGVfbW9kdWxlcy9nZXQtYnJvd3Nlci1ydGMvaW5kZXguanM/ZjMxZSJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBvcmlnaW5hbGx5IHB1bGxlZCBvdXQgb2Ygc2ltcGxlLXBlZXJcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRCcm93c2VyUlRDICgpIHtcbiAgaWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAndW5kZWZpbmVkJykgcmV0dXJuIG51bGxcbiAgdmFyIHdydGMgPSB7XG4gICAgUlRDUGVlckNvbm5lY3Rpb246IGdsb2JhbFRoaXMuUlRDUGVlckNvbm5lY3Rpb24gfHwgZ2xvYmFsVGhpcy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fFxuICAgICAgZ2xvYmFsVGhpcy53ZWJraXRSVENQZWVyQ29ubmVjdGlvbixcbiAgICBSVENTZXNzaW9uRGVzY3JpcHRpb246IGdsb2JhbFRoaXMuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gICAgICBnbG9iYWxUaGlzLm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fCBnbG9iYWxUaGlzLndlYmtpdFJUQ1Nlc3Npb25EZXNjcmlwdGlvbixcbiAgICBSVENJY2VDYW5kaWRhdGU6IGdsb2JhbFRoaXMuUlRDSWNlQ2FuZGlkYXRlIHx8IGdsb2JhbFRoaXMubW96UlRDSWNlQ2FuZGlkYXRlIHx8XG4gICAgICBnbG9iYWxUaGlzLndlYmtpdFJUQ0ljZUNhbmRpZGF0ZVxuICB9XG4gIGlmICghd3J0Yy5SVENQZWVyQ29ubmVjdGlvbikgcmV0dXJuIG51bGxcbiAgcmV0dXJuIHdydGNcbn1cbiJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiZ2V0QnJvd3NlclJUQyIsImdsb2JhbFRoaXMiLCJ3cnRjIiwiUlRDUGVlckNvbm5lY3Rpb24iLCJtb3pSVENQZWVyQ29ubmVjdGlvbiIsIndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uIiwiUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwibW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwid2Via2l0UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwiUlRDSWNlQ2FuZGlkYXRlIiwibW96UlRDSWNlQ2FuZGlkYXRlIiwid2Via2l0UlRDSWNlQ2FuZGlkYXRlIl0sIm1hcHBpbmdzIjoiQUFBQSx1Q0FBdUM7QUFFdkNBLE9BQU9DLE9BQU8sR0FBRyxTQUFTQztJQUN4QixJQUFJLE9BQU9DLGVBQWUsYUFBYSxPQUFPO0lBQzlDLElBQUlDLE9BQU87UUFDVEMsbUJBQW1CRixXQUFXRSxpQkFBaUIsSUFBSUYsV0FBV0csb0JBQW9CLElBQ2hGSCxXQUFXSSx1QkFBdUI7UUFDcENDLHVCQUF1QkwsV0FBV0sscUJBQXFCLElBQ3JETCxXQUFXTSx3QkFBd0IsSUFBSU4sV0FBV08sMkJBQTJCO1FBQy9FQyxpQkFBaUJSLFdBQVdRLGVBQWUsSUFBSVIsV0FBV1Msa0JBQWtCLElBQzFFVCxXQUFXVSxxQkFBcUI7SUFDcEM7SUFDQSxJQUFJLENBQUNULEtBQUtDLGlCQUFpQixFQUFFLE9BQU87SUFDcEMsT0FBT0Q7QUFDVCIsImZpbGUiOiIoc3NyKS8uL25vZGVfbW9kdWxlcy9nZXQtYnJvd3Nlci1ydGMvaW5kZXguanMiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/get-browser-rtc/index.js\n");

/***/ })

};
;