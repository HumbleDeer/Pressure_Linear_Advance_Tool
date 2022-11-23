/**
 * Pressure Advance Calibration Pattern
 * Copyright (C) 2019 Sineos [https://github.com/Sineos]
 * Copyright (C) 2022 AndrewEllis93 [https://github.com/AndrewEllis93]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
'use strict';

// increment to invalidate saved settings
const SETTINGS_VERSION = '1';

const PA_round = -4; // Was previously -3
const Z_round = -3;
const XY_round = -4;
const EXT_round = -5; // Was previously -4

var CUR_X = 0, // Globally track current coordinates
    CUR_Y = 0,
    CUR_Z = 0,
    RETRACTED = false; // Globally keep track of current retract state to prevent retracting/unretracting twice

// set global HTML vars from form inputs
// -------------------------------------
function setVars(){
  window.ACCELERATION = parseInt($('#PRINT_ACCL').val());
  window.ANCHOR_LAYER_LINE_RATIO = parseFloat($('#ANCHOR_LAYER_LINE_RATIO').val());
  window.ANCHOR_OPTION = $('#ANCHOR_OPTION').val();
  window.ANCHOR_PERIMETERS = parseFloat($('#ANCHOR_PERIMETERS').val());
  window.BED_SHAPE = $('#BED_SHAPE').val();
  window.BED_TEMP = parseInt($('#BED_TEMP').val());
  window.BED_X = parseInt($('#BED_X').val());
  window.BED_Y = parseInt($('#BED_Y').val());
  window.ECHO = $('#ECHO').prop('checked');
  window.END_GCODE = $('#END_GCODE').val();
  window.EXTRUDER_NAME = $('#EXTRUDER_NAME').val();
  window.EXT_MULT = parseFloat($('#EXT_MULT').val());
  window.EXT_MULT_PRIME = parseFloat($('#ENT_MULT_PRIME').val());
  window.FAN_SPEED = parseFloat($('#FAN_SPEED').val());
  window.FAN_SPEED_FIRSTLAYER = parseFloat($('#FAN_SPEED_FIRSTLAYER').val());
  window.FIRMWARE = $('#FIRMWARE').val();
  window.FILAMENT = $('#FILAMENT').val();
  window.FILAMENT_DIAMETER = parseFloat($('#FILAMENT_DIAMETER').val());
  window.FILENAME = $('#FILENAME').val();
  window.HEIGHT_FIRSTLAYER = parseFloat($('#HEIGHT_FIRSTLAYER').val());
  window.HEIGHT_LAYER = parseFloat($('#HEIGHT_LAYER').val());
  window.HEIGHT_PRINT = parseFloat($('#HEIGHT_PRINT').val());
  window.HOTEND_TEMP = parseInt($('#HOTEND_TEMP').val());
  window.LINE_RATIO = parseFloat($('#LINE_RATIO').val());
  window.NOZZLE_DIAMETER = parseFloat($('#NOZZLE_DIAMETER').val());
  window.ORIGIN_CENTER = $('#ORIGIN_CENTER').prop('checked');
  window.PATTERN_ANGLE = parseInt($('#PATTERN_ANGLE').val());
  window.PATTERN_OPTIONS_ENABLE = $('#PATTERN_OPTIONS_ENABLE').prop('checked');
  window.PATTERN_SIDE_LENGTH = parseInt($('#PATTERN_SIDE_LENGTH').val());
  window.PATTERN_SPACING = parseFloat($('#PATTERN_SPACING').val());
  window.PA_END = parseFloat($('#PA_END').val());
  window.PA_START = parseFloat($('#PA_START').val());
  window.PA_STEP = parseFloat($('#PA_STEP').val());
  window.PERIMETERS = parseInt($('#PERIMETERS').val());
  window.PRINTER = $('#PRINTER').val();
  window.PRINT_DIR = $('#PRINT_DIR').val();
  window.RETRACT_DIST = parseFloat($('#RETRACT_DIST').val());
  window.SPEED_FIRSTLAYER = parseInt($('#SPEED_FIRSTLAYER').val());
  window.SPEED_TRAVEL = parseInt($('#SPEED_TRAVEL').val());
  window.SPEED_PERIMETER = parseInt($('#SPEED_PERIMETER').val());
  window.SPEED_RETRACT = parseInt($('#SPEED_RETRACT').val());
  window.SPEED_UNRETRACT = parseInt($('#SPEED_UNRETRACT').val());
  window.START_GCODE = $('#START_GCODE').val();
  window.START_GCODE_TYPE = $('#START_GCODE_TYPE').val();
  window.TOOL_INDEX = $('#TOOL_INDEX').val();
  window.ZHOP_ENABLE = $('#ZHOP_ENABLE').prop('checked');
  window.ZHOP_HEIGHT = parseFloat($('#ZHOP_HEIGHT').val());
  //SPEED_PRIME = parseInt($('#PRIME_SPEED').val());
  //USE_LINENO = $('#LINE_NO').prop('checked');
  //USE_PRIME = $('#PRIME').prop('checked');

  // adjust settings
  // ---------------
  if (BED_SHAPE === 'Round') {
    ORIGIN_CENTER = true;
    BED_Y = BED_X;
  }

  // if "pattern settings" checkbox isn't checked, set to defaults instead
  if (!PATTERN_OPTIONS_ENABLE){
    HEIGHT_PRINT = parseFloat($('#HEIGHT_PRINT').prop("defaultValue"));
    PERIMETERS = parseInt($('#PERIMETERS').prop("defaultValue"));
    PATTERN_SIDE_LENGTH = parseInt($('#PATTERN_SIDE_LENGTH').prop("defaultValue"));
    PATTERN_SPACING = parseFloat($('#PATTERN_SPACING').prop("defaultValue"));
    PATTERN_ANGLE = parseInt($('#PATTERN_ANGLE').prop("defaultValue"));
    PRINT_DIR = 0;
  }

  SPEED_FIRSTLAYER *= 60;
  SPEED_PERIMETER *= 60;
  SPEED_TRAVEL *= 60;
  //SPEED_PRIME *= 60;
  SPEED_RETRACT *= 60;
  SPEED_UNRETRACT *= 60;

  // replace variables with actual numbers in start g-code
  START_GCODE = START_GCODE.replace(/\[HOTEND_TEMP\]/g, HOTEND_TEMP)
  START_GCODE = START_GCODE.replace(/\[BED_TEMP\]/g, BED_TEMP)
  START_GCODE = START_GCODE.replace(/\[EXTRUDER_NAME\]/g, EXTRUDER_NAME)
  START_GCODE = START_GCODE.replace(/\[TOOL_INDEX\]/g, TOOL_INDEX)

  // set global calculated variables
  // -------------------------------
  window.NUM_PATTERNS = Math.round((PA_END - PA_START) / PA_STEP + 1);
  window.NUM_LAYERS = Math.round((HEIGHT_PRINT - HEIGHT_FIRSTLAYER) / HEIGHT_LAYER + 1);

  // line widths and extrusion ratios
  window.LINE_WIDTH = NOZZLE_DIAMETER * (LINE_RATIO / 100); // this has to be rounded or it causes issues
  window.ANCHOR_LAYER_LINE_WIDTH = NOZZLE_DIAMETER * (ANCHOR_LAYER_LINE_RATIO / 100);
  window.EXTRUSION_RATIO = LINE_WIDTH * HEIGHT_LAYER / (Math.pow(FILAMENT_DIAMETER / 2, 2) * Math.PI);
  window.ANCHOR_LAYER_EXTRUSION_RATIO = ANCHOR_LAYER_LINE_WIDTH * HEIGHT_FIRSTLAYER / (Math.pow(FILAMENT_DIAMETER / 2, 2) * Math.PI);

  // line spacings
  window.LINE_SPACING = LINE_WIDTH - HEIGHT_LAYER * (1 - Math.PI / 4); // from slic3r documentation: spacing = extrusion_width - layer_height * (1 - PI/4)
  window.ANCHOR_LAYER_LINE_SPACING = ANCHOR_LAYER_LINE_WIDTH - HEIGHT_LAYER * (1 - Math.PI / 4);
  window.LINE_SPACING_ANGLE = LINE_SPACING / Math.sin(toRadians(PATTERN_ANGLE)/2);

  // calculate end dimensions so we can center the print properly & know where to start/end
  window.CENTER_X = (ORIGIN_CENTER ? 0 : BED_X / 2);
  window.CENTER_Y = (ORIGIN_CENTER ? 0 : BED_Y / 2);
  window.PRINT_SIZE_X = Math.round10((NUM_PATTERNS * ((PERIMETERS - 1) * LINE_SPACING_ANGLE)) + 
                 ((NUM_PATTERNS - 1) *  (PATTERN_SPACING + LINE_WIDTH)) + 
                 (Math.cos(toRadians(PATTERN_ANGLE)/2) * PATTERN_SIDE_LENGTH), XY_round);
  window.PRINT_SIZE_Y = Math.round10(2 * (Math.sin(toRadians(PATTERN_ANGLE)/2) * PATTERN_SIDE_LENGTH), XY_round); // hypotenuse of given angle
  if (ANCHOR_OPTION == 'anchor_frame'){ // with anchor frame, right side is moved out (frame thickness - 1 perim) so last pattern's tip doesn't run over it on the first layer
    PRINT_SIZE_X += ANCHOR_LAYER_LINE_SPACING * (ANCHOR_PERIMETERS - 1);
  }
  window.PAT_START_X = CENTER_X - (PRINT_SIZE_X / 2);
  window.PAT_START_Y = CENTER_Y - (PRINT_SIZE_Y / 2);

  // real world print size, accounting for rotation and line widths.
  // this is just used to ensure it will fit on the print bed during input validation
  // actual gcode rotation is done during gcode generation
  window.FIT_WIDTH = PRINT_SIZE_X + LINE_WIDTH; // actual size is technically + one line width in each direction, as it squishes outwards.... this is probably being excessively anal
  window.FIT_HEIGHT = PRINT_SIZE_Y + LINE_WIDTH;
  FIT_WIDTH = Math.abs(PRINT_SIZE_X * Math.cos(toRadians(PRINT_DIR))) + Math.abs(PRINT_SIZE_Y * Math.sin(toRadians(PRINT_DIR))); // rotate by PRINT_DIR
  FIT_HEIGHT = Math.abs(PRINT_SIZE_X * Math.sin(toRadians(PRINT_DIR))) + Math.abs(PRINT_SIZE_Y * Math.cos(toRadians(PRINT_DIR)));
}

function genGcode() {
  setVars();

  var basicSettings = {
    'firstLayerSpeed': SPEED_FIRSTLAYER,
    'moveSpeed': SPEED_TRAVEL,
    'perimSpeed': SPEED_PERIMETER,
    'centerX': CENTER_X,
    'centerY': CENTER_Y,
    'printDir': PRINT_DIR,
    'layerHeight': HEIGHT_LAYER,
    'firstLayerHeight': HEIGHT_FIRSTLAYER,
    'lineWidth': LINE_WIDTH,
    'lineSpacing': LINE_SPACING,
    'extRatio': EXTRUSION_RATIO,
    'extMult': EXT_MULT,
    'extMultPrime': EXT_MULT_PRIME,
    'anchorExtRatio': ANCHOR_LAYER_EXTRUSION_RATIO,
    'anchorLineWidth': ANCHOR_LAYER_LINE_WIDTH,
    'anchorLineSpacing': ANCHOR_LAYER_LINE_SPACING,
    'retractDist': RETRACT_DIST,
    'retractSpeed': SPEED_RETRACT,
    'unretractSpeed': SPEED_UNRETRACT,
    'extruderName': EXTRUDER_NAME,
    'zhopEnable': ZHOP_ENABLE,
    'zhopHeight': ZHOP_HEIGHT
  };

  // Start G-code for pattern
  window.pa_script = `\
; ### Klipper Pressure Advance Calibration Pattern ###
;
; Original Marlin linear advance calibration tool by Sineos [https://github.com/Sineos]
; Heavily modified/rewritten by Andrew Ellis [https://github.com/AndrewEllis93]
;
; -------------------------------------------
; Generated: ${new Date()}
; -------------------------------------------
;
; Printer:
;  - Firmware: ${FIRMWARE}
;  - Bed Shape: ${BED_SHAPE}
${(BED_SHAPE === 'Round' ? `;  - Bed Diameter: ${BED_X} mm\n`: `;  - Bed Size X: ${BED_X} mm\n`)}\
${(BED_SHAPE === 'Round' ? '': `;  - Bed Size Y: ${BED_Y} mm\n`)}\
;  - Origin Bed Center: ${(ORIGIN_CENTER ? 'true': 'false')}
${(FIRMWARE == 'klipper' ? `;  - Extruder Name: ${EXTRUDER_NAME}\n`: `;  - Extruder Index: ${TOOL_INDEX}\n`)}\
;  - Travel Speed: ${SPEED_TRAVEL / 60} mm/s
;  - Nozzle Diameter: ${NOZZLE_DIAMETER} mm
;
; Start / End G-code:
;  - Start G-code Type: ${START_GCODE_TYPE}
;  - Hotend Temp: ${HOTEND_TEMP}C
;  - Bed Temp: ${BED_TEMP}C
;
; Filament / Flow:
;  - Filament Diameter: ${FILAMENT_DIAMETER} mm
;  - Extrusion Multiplier: ${EXT_MULT}
;  - Line Width: ${LINE_RATIO} %
;
; Retraction / Z Hop:
;  - Retraction Distance: ${RETRACT_DIST} mm
;  - Retract Speed: ${SPEED_RETRACT / 60} mm/s
;  - Unretract Speed: ${SPEED_UNRETRACT / 60} mm/s
;  - Z Hop Enable: ${ZHOP_ENABLE}
${(ZHOP_ENABLE ? `;  - Z Hop Height: ${ZHOP_HEIGHT}mm`: '')} 
;
; First Layer Settings:
;  - First Layer Height: ${HEIGHT_FIRSTLAYER} mm
;  - First Layer Printing Speed: ${SPEED_FIRSTLAYER} mm/s
;  - First Layer Fan: ${FAN_SPEED_FIRSTLAYER}%
;  - Anchor Option: ${ANCHOR_OPTION}
${(ANCHOR_OPTION == 'anchor_frame' ? `;  - Anchor Frame Perimeters: ${ANCHOR_PERIMETERS}\n`: '')}\
${(ANCHOR_OPTION != 'no_anchor' ? `;  - Anchor Line Width: ${ANCHOR_LAYER_LINE_RATIO} %\n`: '')}\
;
; Print Settings:
;  - Layer Height: ${HEIGHT_LAYER} mm
;  - Print Speed: ${SPEED_PERIMETER} mm/s
;  - Acceleration: ${ACCELERATION} mm/s^2
;  - Fan Speed: ${FAN_SPEED}%
;
; Pattern Settings ${(!PATTERN_OPTIONS_ENABLE ? `(Using defaults)`: '`(Customized)`')}:
;  - Print Height: ${HEIGHT_PRINT} mm
;  - Perimeter Count: ${PERIMETERS}
;  - Side Length: ${PATTERN_SIDE_LENGTH} mm
;  - Spacing: ${PATTERN_SPACING} mm
;  - Corner Angle: ${PATTERN_ANGLE} degrees 
;  - Printing Direction: ${PRINT_DIR} degree
;
; Pressure Advance Stepping:
;  - ${(FIRMWARE == 'klipper' ? 'PA' : 'LA')} Start Value: ${Math.round10(PA_START, PA_round)}
;  - ${(FIRMWARE == 'klipper' ? 'PA' : 'LA')} End Value: ${PA_END}
;  - ${(FIRMWARE == 'klipper' ? 'PA' : 'LA')} Increment: ${PA_STEP}
;  - Show on LCD: ${ECHO}
;
; Calculated Values:
;  - Number of Patterns to Print: ${NUM_PATTERNS}
;  - ${(FIRMWARE == 'klipper' ? 'PA' : 'LA')} Values: `;
 
for (let i = 0; i < NUM_PATTERNS; i++){
  pa_script += Math.round10((PA_START + i * PA_STEP),PA_round);
  if (i != NUM_PATTERNS - 1){ // add comma separator if not last item in list
    pa_script += ', '
  }
  else {
      pa_script += '\n'
  }
}

pa_script += `\
;  - Print Size X: ${Math.round10(FIT_WIDTH, -2)} mm
;  - Print Size Y: ${Math.round10(FIT_HEIGHT, -2)} mm
;  - Total Number of Layers: ${NUM_LAYERS}
;
; Prepare printing
; 
${START_GCODE}
G21 ; Millimeter units
G90 ; Absolute XYZ
M83 ; Relative E
G92 E0 ; Reset extruder distance
;
;  Begin printing
;
M106 S${Math.round(FAN_SPEED_FIRSTLAYER * 2.55)}${(FIRMWARE == 'marlin' ? ` P${TOOL_INDEX}` : '')} ; Set fan speed
${(FIRMWARE == 'klipper' ? `SET_VELOCITY_LIMIT ACCEL=${ACCELERATION}` : `M204 P${ACCELERATION}` )} ; Set printing acceleration
`;

// Number Lines: ${(USE_LINENO ? 'true': 'false')}\n             
// Prime Nozzle: ${(USE_PRIME ? 'true': 'false')}\n
// Prime Extrusion Multiplier: ${EXT_MULT_PRIME}\n
// Prime Speed: ${SPEED_PRIME}\n`

  var TO_X = PAT_START_X,
      TO_Y = PAT_START_Y,
      TO_Z = HEIGHT_FIRSTLAYER;

  CUR_Z = HEIGHT_FIRSTLAYER; // set initial Z coordinate, otherwise z hop will go back to 0 at first
7
  //Move to layer height then start position, set initial PA
  pa_script += moveTo(TO_X, TO_Y, basicSettings, {comment: ' ; Move to start position\n'}) + 
               moveToZ(TO_Z, basicSettings, {comment: ' ; Move to start layer height\n'})
  
  if (FIRMWARE == 'klipper'){
    pa_script += `SET_PRESSURE_ADVANCE ADVANCE=${Math.round10(PA_START, PA_round)} EXTRUDER=${EXTRUDER_NAME} ; Set pressure advance\n`;
    if (ECHO){pa_script += `M117 PA${Math.round10(PA_START, PA_round)}\n`}
  }
  else {
    pa_script += `M900 K${Math.round10(PA_START, PA_round)} ${(TOOL_INDEX != 0 ? `T${TOOL_INDEX} ` : '')}; Set linear advance k factor\n`;
    if (ECHO){pa_script += `M117 K${Math.round10(PA_START, PA_round)}\n`}
  }
    
  if (ANCHOR_OPTION == 'anchor_frame'){
    pa_script += createAnchorPerimeters(PAT_START_X, PAT_START_Y, PRINT_SIZE_X, PRINT_SIZE_Y, ANCHOR_PERIMETERS, basicSettings);
  }
  else if (ANCHOR_OPTION == 'anchor_layer'){
    // create enough perims to reach center (concentric fill)
    
    var NUM_CONCENTRIC = Math.min(
                                  Math.floor((PRINT_SIZE_Y * Math.sin(toRadians(45))) / (ANCHOR_LAYER_LINE_SPACING / Math.sin(toRadians(45)))),
                                  Math.floor((PRINT_SIZE_X * Math.sin(toRadians(45))) / (ANCHOR_LAYER_LINE_SPACING / Math.sin(toRadians(45))))
                                 );
    pa_script += createAnchorPerimeters(PAT_START_X, PAT_START_Y, PRINT_SIZE_X, PRINT_SIZE_Y, NUM_CONCENTRIC, basicSettings);
  }

  // draw PA pattern
  for (let i = (ANCHOR_OPTION == 'anchor_layer' ? 1 : 0); i < NUM_LAYERS ; i++){ // skip first layer if using full anchor layer
    TO_X = PAT_START_X;
    TO_Y = PAT_START_Y;
    TO_Z = (i * HEIGHT_LAYER) + HEIGHT_FIRSTLAYER;

    if (i == 1){ // set new fan speed after first layer
      pa_script += `M106 S${Math.round(FAN_SPEED_FIRSTLAYER * 2.55)}${(FIRMWARE == 'marlin' ? ` P${TOOL_INDEX}` : '')} ; Set fan speed\n`
    }

    if (i == 0 && ANCHOR_OPTION == 'anchor_frame'){ // if printing first layer with a frame, shrink to fit inside frame
      var SHRINK = (ANCHOR_LAYER_LINE_SPACING * (ANCHOR_PERIMETERS - 1)) / Math.sin(toRadians(PATTERN_ANGLE) / 2);
      var SIDE_LENGTH = PATTERN_SIDE_LENGTH - SHRINK; 
      TO_X += SHRINK * Math.sin(toRadians(90) - toRadians(PATTERN_ANGLE) / 2);
      TO_Y += ANCHOR_LAYER_LINE_SPACING * (ANCHOR_PERIMETERS - 1);
    } else {
      var SIDE_LENGTH = PATTERN_SIDE_LENGTH;
    }

    var INITIAL_X = TO_X,
        INITIAL_Y = TO_Y;

    // move to start xy then layer height
    pa_script += moveTo(TO_X, TO_Y, basicSettings, {comment: ' ; Move to start\n'}) +
                 moveToZ(TO_Z, basicSettings, {comment: ' ; Move to layer height\n'});

    for (let j = 0; j < NUM_PATTERNS; j++){

      // increment pressure advance
      if (FIRMWARE == 'klipper'){
        pa_script += `SET_PRESSURE_ADVANCE ADVANCE=${Math.round10((PA_START + (j * PA_STEP)), PA_round)} EXTRUDER=${EXTRUDER_NAME} ; Set pressure advance\n`;
        if (ECHO){pa_script += `M117 PA${Math.round10((PA_START + (j * PA_STEP)), PA_round)}\n`}
      }
      else {
        pa_script += `M900 K${Math.round10((PA_START + (j * PA_STEP)), PA_round)} ${(TOOL_INDEX != 0 ? `T${TOOL_INDEX} ` : '')}; Set linear advance k factor\n`;
        if (ECHO){pa_script += `M117 K${Math.round10((PA_START + (j * PA_STEP)), PA_round)}\n`}
      }
                   
      for (let k = 0; k < PERIMETERS ; k++){
        TO_X += (Math.cos(toRadians(PATTERN_ANGLE) / 2) * SIDE_LENGTH);
        TO_Y += (Math.sin(toRadians(PATTERN_ANGLE) / 2) * SIDE_LENGTH);
        pa_script += createLine(TO_X, TO_Y, basicSettings, {'speed': (i == 0 ? SPEED_FIRSTLAYER : SPEED_PERIMETER), comment: ' ; Print pattern perimeter\n'});

        TO_X -= Math.cos(toRadians(PATTERN_ANGLE) / 2) * SIDE_LENGTH;
        TO_Y += Math.sin(toRadians(PATTERN_ANGLE) / 2) * SIDE_LENGTH;
        pa_script += createLine(TO_X, TO_Y, basicSettings, {'speed': (i == 0 ? SPEED_FIRSTLAYER : SPEED_PERIMETER), comment: ' ; Print pattern perimeter\n'});

        TO_Y = INITIAL_Y;
        switch (true){
          case k != PERIMETERS - 1:  // perims not done yet. move to next perim
            TO_X += LINE_SPACING_ANGLE;
            pa_script += moveTo(TO_X, TO_Y, basicSettings, {comment: ' ; Move to start next pattern perimeter\n'});
            break;
          case j != NUM_PATTERNS - 1: // patterns not done yet. move to next pattern
            TO_X += (PATTERN_SPACING + LINE_WIDTH);
            pa_script += moveTo(TO_X, TO_Y, basicSettings, {comment: ' ; Move to next pattern\n'});
            break;
          case i != NUM_LAYERS - 1: // layers not done yet. move back to start
            TO_X = INITIAL_X;
            pa_script += moveTo(TO_X, TO_Y, basicSettings, {comment: ' ; Move back to start position\n'});
            break;
          default:  // everything done. break
            break;
        }
      }
    }
  }

/*
  // Prime nozzle if activated
  if (USE_PRIME) {
    var primeStartX = CENTER_X - LENGTH_SLOW - (0.5 * PATTERN_SIDE_LENGTH) - (USE_LINENO ? 4 : 0) - 5,
        primeStartY = CENTER_Y - (PRINT_SIZE_Y / 2);

    pa_script += ';\n' +
                '; prime nozzle\n' +
                ';\n' +
                moveTo(primeStartX, primeStartY, basicSettings) +
                createLine(primeStartX, primeStartY + PRINT_SIZE_Y, PRINT_SIZE_Y, basicSettings, {'extMult': EXT_MULT_PRIME, 'speed': SPEED_PRIME}) +
                moveTo(primeStartX + (LINE_WIDTH * 1.5), primeStartY + PRINT_SIZE_Y, basicSettings) +
                createLine(primeStartX + (LINE_WIDTH * 1.5), primeStartY, -PRINT_SIZE_Y, basicSettings, {'extMult': EXT_MULT_PRIME, 'speed': SPEED_PRIME}) +
                doEfeed('-', basicSettings);
  }

  // print K values beside the test lines
  if (USE_LINENO) {
    var numStartX = CENTER_X + (0.5 * PATTERN_SIDE_LENGTH) + LENGTH_SLOW + (USE_PRIME ? 5 : 0) - 2,
        numStartY = PAT_START_Y - 2,
        stepping = 0;

    pa_script += ';\n' +
                '; print K-values\n' +
                ';\n';

    for (var i = PA_START; i <= PA_END; i += PA_STEP) {
      if (stepping % 2 === 0) {
        pa_script += moveTo(numStartX, numStartY + (stepping * PATTERN_SPACING), basicSettings) +
                    zHop((HEIGHT_LAYER + Z_OFFSET), basicSettings) +
                    doEfeed('+', basicSettings) +
                    createGlyphs(numStartX, numStartY + (stepping * PATTERN_SPACING), basicSettings, Math.round10(i, PA_round)) +
                    doEfeed('-', basicSettings) +
                    zHop((HEIGHT_LAYER + Z_OFFSET) + 0.1, basicSettings);
      }
      stepping += 1;
    }
  }
  */
  
  if (FIRMWARE == 'klipper'){
    pa_script += `SET_PRESSURE_ADVANCE ADVANCE=${Math.round10(PA_START, PA_round)} EXTRUDER=${EXTRUDER_NAME} ; Set pressure advance back to start value\n`;
    if (ECHO){pa_script += `M117 PA${Math.round10(PA_START, PA_round)}\n`}
  }
  else {
    pa_script += `M900 K${Math.round10(PA_START, PA_round)} ${(TOOL_INDEX != 0 ? `T${TOOL_INDEX} ` : '')}; Set linear advance k factor back to start value\n`;
    if (ECHO){pa_script += `M117 K${Math.round10(PA_START, PA_round)}\n`}
  }
  pa_script += doEfeed('-', basicSettings) +`\
;
; End G-code
;
${END_GCODE}
;
; FINISH
;
`;

  $('#gcodetextarea').val(pa_script);
}


// Save content of textarea to file using
// https://github.com/eligrey/FileSaver.js
function saveTextAsFile() {
  if (pa_script) {
    var pa_script_blob = new Blob([pa_script], {type: 'text/plain'})
    saveAs(pa_script_blob, `${$('#FILENAME').val()}.gcode`);
  } else {
    alert('Generate G-code first');
  }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
(function() {

  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */

  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || Number(exp) === 0) {
      return Math[type](value);
    }
    value = Number(value);
    exp = Number(exp);
    // If the value is not a number or the exp is not an integer...
    if (value === null || isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // If the value is negative...
    if (value < 0) {
      return -decimalAdjust(type, -value, exp);
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](Number(value[0] + 'e' + (value[1] ? (Number(value[1]) - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return Number(value[0] + 'e' + (value[1] ? (Number(value[1]) + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
}());

// get the number of decimal places of a float
function getDecimals(num) {
  var match = (String(num)).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) {
    return num;
  }
  var decimalPlaces = Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? Number(match[2]) : 0));
  return decimalPlaces;
}

// convert degrees to radians
function toRadians(degrees){
  return degrees * (Math.PI / 180);
}

// return distance between two point
function getDistance(cur_x, cur_y, to_x, to_y){
  return Math.hypot((to_x - cur_x), (to_y - cur_y));
}

// print a line between current position and target
function createLine(to_x, to_y, basicSettings, optional) {
  var ext = 0,
      length = 0,
      gcode = '';

  //handle optional function arguements passed as object
  var defaults = {
    extMult: basicSettings['extMult'],
    extRatio: basicSettings['extRatio'],
    speed: basicSettings['firstLayerSpeed'],
    comment: ' ; Print line\n'
  };
  var optArgs = $.extend({}, defaults, optional);

  // change speed if first layer
  if (Math.round10(CUR_Z, Z_round) == basicSettings['firstLayerHeight']){
    optArgs['speed'] = basicSettings['firstLayerSpeed'];
  } else {
    optArgs['speed'] = basicSettings['perimSpeed'];
  }

  length = getDistance(CUR_X, CUR_Y, to_x, to_y);
  ext = Math.round10(optArgs['extRatio'] * optArgs['extMult'] * Math.abs(length), EXT_round);

  gcode += 'G1 X' + Math.round10(rotateX(to_x, basicSettings['centerX'], to_y, basicSettings['centerY'], basicSettings['printDir']), XY_round) +
             ' Y' + Math.round10(rotateY(to_x, basicSettings['centerX'], to_y, basicSettings['centerY'], basicSettings['printDir']), XY_round) +
             ' E' + ext + ' F' + optArgs['speed'] + optArgs['comment'];

  CUR_X = to_x, // update global position vars
  CUR_Y = to_y;

  return gcode;
}

// move print head to coordinates
function moveTo(to_x, to_y, basicSettings, optional) {
  var gcode = '',
      distance = getDistance(CUR_X, CUR_Y, to_x, to_y);

  var defaults = {
    comment: ' ; Move\n'
  };
  var optArgs = $.extend({}, defaults, optional);

  if(distance >= 2){ // don't retract for travels under 2mm
    gcode += doEfeed('-', basicSettings); //retract
  }

  gcode += 'G0 X' + Math.round10(rotateX(to_x, basicSettings['centerX'], to_y, basicSettings['centerY'], basicSettings['printDir']), XY_round) +
             ' Y' + Math.round10(rotateY(to_x, basicSettings['centerX'], to_y, basicSettings['centerY'], basicSettings['printDir']), XY_round) +
             ' F' + basicSettings['moveSpeed'] + optArgs['comment'];
  
  CUR_X = to_x, // update global position vars
  CUR_Y = to_y;

  if(distance >= 2){
    gcode += doEfeed('+', basicSettings);  //unretract
  }
        
  return gcode;
}

function moveToZ(to_z, basicSettings){
  var gcode = '';
  gcode += 'G1 Z' + Math.round10(to_z, Z_round) + ' F' + basicSettings['moveSpeed'] + ' ; Move to z height\n';
  CUR_Z = to_z; // update global position var
  return gcode;
}

// create retract / un-retract gcode
function doEfeed(dir, basicSettings) {
  var gcode = '';

    switch (true) {
      case (dir === '+' && RETRACTED && !basicSettings['zhopEnable']):
        gcode += 'G1 E' + Math.round10(basicSettings['retractDist'], EXT_round) + ' F' + basicSettings['unretractSpeed'] + ' ; Un-retract\n';
        RETRACTED = false;
        break;
      case (dir === '-' && !RETRACTED && !basicSettings['zhopEnable']):
        gcode += 'G1 E-' + Math.round10(basicSettings['retractDist'], EXT_round) + ' F' + basicSettings['retractSpeed'] + ' ; Retract\n';
        RETRACTED = true;
        break;
      case (dir === '+' && RETRACTED && basicSettings['zhopEnable']):
        gcode += 'G1 Z' + Math.round10(CUR_Z, Z_round) + ' F' + basicSettings['moveSpeed'] + ' ; Z hop return\n' +
                 'G1 E' + Math.round10(basicSettings['retractDist'], EXT_round) + ' F' + basicSettings['unretractSpeed'] + ' ; Un-retract\n';
        RETRACTED = false;
        break;
      case (dir === '-' && !RETRACTED && basicSettings['zhopEnable']):
        gcode += 'G1 E-' + Math.round10(basicSettings['retractDist'], EXT_round) + ' F' + basicSettings['retractSpeed'] + ' ; Retract\n' +
                 'G1 Z' + Math.round10((CUR_Z + basicSettings['zhopHeight']), Z_round) + ' F' + basicSettings['moveSpeed'] + ' ; Z hop\n';
        RETRACTED = true;
        break;
    }

  return gcode;
}

// draw perimeter, move inwards, repeat
function createAnchorPerimeters(min_x, min_y, max_x, max_y, num_perims, basicSettings, optional){
  var gcode = '',
      to_x = min_x,
      to_y = min_y;

  //handle optional function arguments passed as object
  var defaults = {
    spacing: basicSettings['anchorLineSpacing'],
    extRatio: basicSettings['anchorExtRatio'],
    speed: basicSettings['firstLayerSpeed'],
    comment: ' ; Print line\n'
  };

  var optArgs = $.extend({}, defaults, optional);
  
  for (let i = 0; i < num_perims ; i++){

    if (i != 0){ // after first perimeter, step inwards to start next perimeter
      to_x += optArgs['spacing'];
      to_y += optArgs['spacing'];
      gcode += moveTo(to_x, to_y, basicSettings, {comment: ' ; Step inwards to print next anchor perimeter\n'})
    }
    // draw line up
    to_y += max_y - (i * optArgs['spacing']) * 2;
    gcode += createLine(to_x, to_y, basicSettings, {speed: optArgs['speed'], extRatio: optArgs['extRatio'], comment: ' ; Draw anchor perimeter (up)\n'});

    // draw line right
    to_x += max_x - (i * optArgs['spacing']) * 2;
    gcode += createLine(to_x, to_y, basicSettings, {speed: optArgs['speed'], extRatio: optArgs['extRatio'], comment: ' ; Draw anchor perimeter (right)\n'});

    // draw line down
    to_y -= max_y - (i * optArgs['spacing']) * 2;
    gcode += createLine(to_x, to_y, basicSettings, {speed: optArgs['speed'], extRatio: optArgs['extRatio'], comment: ' ; Draw anchor perimeter (down)\n'});

    // draw line left
    to_x -= max_x - (i * optArgs['spacing']) * 2;
    gcode += createLine(to_x, to_y, basicSettings, {speed: optArgs['speed'], extRatio: optArgs['extRatio'], comment: ' ; Draw anchor perimeter (left)\n'});
  }
  return gcode;
}

/*
// create digits for K line numbering
function createGlyphs(startX, startY, basicSettings, value) {
  var glyphSegHeight = 2,
      glyphSegHeight2 = 0.4,
      glyphSpacing = 3.0,
      glyphString = '',
      xCount = 0,
      yCount = 0,
      sNumber = value.toString(),
      glyphSeg = {
        '1': ['up', 'up'],
        '2': ['mup', 'mup', 'right', 'down', 'left', 'down', 'right'],
        '3': ['mup', 'mup', 'right', 'down', 'down', 'left', 'mup', 'right'],
        '4': ['mup', 'mup', 'down', 'right', 'mup', 'down', 'down'],
        '5': ['right', 'up', 'left', 'up', 'right'],
        '6': ['mup', 'right', 'down', 'left', 'up', 'up', 'right'],
        '7': ['mup', 'mup', 'right', 'down', 'down'],
        '8': ['mup', 'right', 'down', 'left', 'up', 'up', 'right', 'down'],
        '9': ['right', 'up', 'left', 'up', 'right', 'down'],
        '0': ['right', 'up', 'up', 'left', 'down', 'down'],
        '.': ['dot']
      };

  for (var i = 0, len = sNumber.length; i < len; i += 1) {
    for (var key in glyphSeg[sNumber.charAt(i)]) {
      if(glyphSeg[sNumber.charAt(i)].hasOwnProperty(key)) {
        var up = createLine(startX + (xCount * glyphSegHeight), startY + (yCount * glyphSegHeight) + glyphSegHeight, glyphSegHeight, basicSettings, {'speed': basicSettings['firstLayerSpeed'], 'comment': ' ; ' + sNumber.charAt(i) + '\n'}),
            down = createLine(startX + (xCount * glyphSegHeight), startY + (yCount * glyphSegHeight) - glyphSegHeight, glyphSegHeight, basicSettings, {'speed': basicSettings['firstLayerSpeed'], 'comment': ' ; ' + sNumber.charAt(i) + '\n'}),
            right = createLine(startX + (xCount * glyphSegHeight) + glyphSegHeight, startY + (yCount * glyphSegHeight), glyphSegHeight, basicSettings, {'speed': basicSettings['firstLayerSpeed'], 'comment': ' ; ' + sNumber.charAt(i) + '\n'}),
            left = createLine(startX + (xCount * glyphSegHeight) - glyphSegHeight, startY + (yCount * glyphSegHeight), glyphSegHeight, basicSettings, {'speed': basicSettings['firstLayerSpeed'], 'comment': ' ; ' + sNumber.charAt(i) + '\n'}),
            mup = moveTo(startX + (xCount * glyphSegHeight), startY + (yCount * glyphSegHeight) + glyphSegHeight, basicSettings),
            dot = createLine(startX, startY + glyphSegHeight2, glyphSegHeight2, basicSettings, {speed: basicSettings['firstLayerSpeed'], comment: ' ; dot\n'});
        if (glyphSeg[sNumber.charAt(i)][key] === 'up') {
          glyphString += up;
          yCount += 1;
        } else if (glyphSeg[sNumber.charAt(i)][key] === 'down') {
          glyphString += down;
          yCount -= 1;
        } else if (glyphSeg[sNumber.charAt(i)][key] === 'right') {
          glyphString += right;
          xCount += 1;
        } else if (glyphSeg[sNumber.charAt(i)][key] === 'left') {
          glyphString += left;
          xCount -= 1;
        } else if (glyphSeg[sNumber.charAt(i)][key] === 'mup') {
          glyphString += mup;
          yCount += 1;
        } else if (glyphSeg[sNumber.charAt(i)][key] === 'dot') {
          glyphString += dot;
        }
      }
    }
    if (sNumber.charAt(i) === '1' || sNumber.charAt(i) === '.') {
      startX += 1;
    } else {
      startX += glyphSpacing;
    }
    if (i !== sNumber.length - 1) {
      glyphString += doEfeed('-', basicSettings, (basicSettings['fwRetract'] ? 'FWR' : 'STD')) +
                     moveTo(startX, startY, basicSettings) +
                     doEfeed('+', basicSettings, (basicSettings['fwRetract'] ? 'FWR' : 'STD'));
    }
    yCount = 0;
    xCount = 0;
  }
  return glyphString;
}
*/

// rotate x around a defined center xm, ym
function rotateX(x, xm, y, ym, a) {
  a = toRadians(a); // Convert to radians
  var cos = Math.cos(a),
      sin = Math.sin(a);

  // Subtract midpoints, so that midpoint is translated to origin
  // and add it in the end again
  //var xr = (x - xm) * cos - (y - ym) * sin + xm; //CCW
  var xr = (cos * (x - xm)) + (sin * (y - ym)) + xm; //CW
  return xr;
}


// rotate y around a defined center xm, ym
function rotateY(x, xm, y, ym, a) {
  a = toRadians(a); // Convert to radians
  var cos = Math.cos(a),
      sin = Math.sin(a);

  // Subtract midpoints, so that midpoint is translated to origin
  // and add it in the end again
  //var yr = (x - xm) * sin + (y - ym) * cos + ym; //CCW
  var yr = (cos * (y - ym)) - (sin * (x - xm)) + ym; //CW
  return yr;
}

// save current settings as localStorage object
function setLocalStorage() {
  var settings = {
    'SETTINGS_VERSION': SETTINGS_VERSION,
    'ACCELERATION' : parseInt($('#PRINT_ACCL').val()),
    'ANCHOR_LAYER_LINE_RATIO' : parseFloat($('#ANCHOR_LAYER_LINE_RATIO').val()),
    'ANCHOR_OPTION' : $('#ANCHOR_OPTION').val(),
    'BED_SHAPE' : $('#BED_SHAPE').val(),
    'BED_TEMP' : parseInt($('#BED_TEMP').val()),
    'BED_X' : parseInt($('#BED_X').val()),
    'BED_Y' : parseInt($('#BED_Y').val()),
    'ECHO' : $('#ECHO').prop('checked'),
    'END_GCODE' : $('#END_GCODE').val(),
    'EXTRUDER_NAME' : $('#EXTRUDER_NAME').val(),
    'EXT_MULT' : parseFloat($('#EXT_MULT').val()),
    'FAN_SPEED' : parseFloat($('#FAN_SPEED').val()),
    'FAN_SPEED_FIRSTLAYER' : parseFloat($('#FAN_SPEED_FIRSTLAYER').val()),
    'FILAMENT_DIAMETER' : parseFloat($('#FILAMENT_DIAMETER').val()),
    'FILENAME' : $('#FILENAME').val(),
    'FIRMWARE' : $('#FIRMWARE').val(),
    'HEIGHT_FIRSTLAYER' : parseFloat($('#HEIGHT_FIRSTLAYER').val()),
    'HEIGHT_LAYER' : parseFloat($('#HEIGHT_LAYER').val()),
    'HEIGHT_PRINT' : parseFloat($('#HEIGHT_PRINT').val()),
    'HOTEND_TEMP' : parseInt($('#HOTEND_TEMP').val()),
    'LINE_RATIO' : parseFloat($('#LINE_RATIO').val()),
    'NOZZLE_DIAMETER' : parseFloat($('#NOZZLE_DIAMETER').val()),
    'ORIGIN_CENTER' : $('#ORIGIN_CENTER').prop('checked'),
    'PATTERN_ANGLE' : parseFloat($('#PATTERN_ANGLE').val()),
    'PATTERN_OPTIONS_ENABLE' : $('#PATTERN_OPTIONS_ENABLE').prop('checked'),
    'PATTERN_SIDE_LENGTH' : parseFloat($('#PATTERN_SIDE_LENGTH').val()),
    'PATTERN_SPACING' : parseFloat($('#PATTERN_SPACING').val()),
    'PA_END' : parseFloat($('#PA_END').val()),
    'PA_START' : parseFloat($('#PA_START').val()),
    'PA_STEP' : parseFloat($('#PA_STEP').val()),
    'PERIMETERS' : parseFloat($('#PERIMETERS').val()),
    'PRINT_DIR' : $('#PRINT_DIR').val(),
    'RETRACT_DIST' : parseFloat($('#RETRACT_DIST').val()),
    'SPEED_FIRSTLAYER' : parseInt($('#SPEED_FIRSTLAYER').val()),
    'SPEED_PERIMETER' : parseInt($('#SPEED_PERIMETER').val()),
    'SPEED_RETRACT' : parseInt($('#SPEED_RETRACT').val()),
    'SPEED_TRAVEL' : parseInt($('#SPEED_TRAVEL').val()),
    'SPEED_UNRETRACT' : parseInt($('#SPEED_UNRETRACT').val()),
    'START_GCODE' : $('#START_GCODE').val(),
    'START_GCODE_TYPE' : $('#START_GCODE_TYPE').val(),
    'TOOL_INDEX' : parseInt($('#TOOL_INDEX').val()),
    'ZHOP_ENABLE' : $('#ZHOP_ENABLE').prop('checked'),
    'ZHOP_HEIGHT' : parseFloat($('#ZHOP_HEIGHT').val()),
    //'EXT_MULT_PRIME' : parseFloat($('#ENT_MULT_PRIME').val()),
    //'SPEED_PRIME' : parseFloat($('#PRIME_SPEED').val()),
    //'USE_LINENO' : $('#LINE_NO').prop('checked');
    //'USE_PRIME' : $('#PRIME').prop('checked'),
  };

  const lsSettings = JSON.stringify(settings);
  window.localStorage.setItem('PA_SETTINGS', lsSettings);
}

// toggle between round and rectangular bed shape
function toggleBedShape() {
  if ($('#BED_SHAPE').val() === 'Round') {
    $('label[for=BED_X]').text('Bed Diameter:');
    $('label[for=BED_Y]').parent().hide();
    $('#BED_Y').parent().hide();
    $('#ORIGIN_CENTER').parents().eq(1).hide();
  } else {
    $('label[for=\'BED_X\']').text('Bed Size X:');
    $('label[for=BED_Y]').parent().show();
    $('#BED_Y').parent().show();
    $('#ORIGIN_CENTER').parents().eq(1).show();
  }
}

// toggle prime relevant options
/*
function togglePrime() {
  if ($('#PRIME').is(':checked')) {
    $('#ENT_MULT_PRIME').prop('disabled', false);
    $('label[for=PRIME_EXT]').css({opacity: 1});
  } else {
    $('#ENT_MULT_PRIME').prop('disabled', true);
    $('label[for=PRIME_EXT]').css({opacity: 0.5});
  }
}
*/

function toggleStartEndGcode(){
  var CANNED_GCODE = `\
ACTIVATE_EXTRUDER EXTRUDER=[EXTRUDER_NAME] ; Activate extruder
G28                                        ; Home all axes
G90                                        ; Use absolute positioning
G1 Z5 F100                                 ; Z raise
M190 S[BED_TEMP]                           ; Set and wait for bed temp
M109 S[HOTEND_TEMP]                        ; Set and wait for hotend temp
;G32                                       ; Tramming macro (uncomment if used)
;QUAD_GANTRY_LEVEL                         ; Level flying gantry (uncomment if used)
;Z_TILT_ADJUST                             ; Tilt level bed (uncomment if used)
G28 Z                                      ; Home Z
;BED_MESH_CALIBRATE                        ; Generate bed mesh (uncomment if used)
M112                                       ; Reading comprehension check! (emergency stop)`

  var STANDALONE_MACRO = `\
ACTIVATE_EXTRUDER EXTRUDER=[EXTRUDER_NAME] ; Activate extruder
M190 S[BED_TEMP]                           ; Set and wait for bed temp
M109 S[HOTEND_TEMP]                        ; Set and wait for hotend temp
PRINT_START                                ; Start macro
;
; Make sure this macro name matches your own! 
; (For example, some may use START_PRINT instead.)
;
M112                                       ; Reading comprehension check! (emergency stop)`

  var STANDALONE_TEMP_PASSING_MACRO = `\
ACTIVATE_EXTRUDER EXTRUDER=[EXTRUDER_NAME]      ; Activate extruder
PRINT_START HOTEND=[HOTEND_TEMP] BED=[BED_TEMP] ; Start macro w/ temp params
;
; - Make sure the macro name AND parameter names match YOUR start macro setup!
;     (For example, some macros use EXTRUDER=X rather than HOTEND=X, or START_PRINT instead of PRINT_START)!
; - Replace any slicer variables with those listed above! It should look like the top example, !!! NOT !!! like this:
;     PRINT_START BED=[first_layer_bed_temperature](...)
;
M112                                            ; Reading comprehension check! (emergency stop)`

  var MARLIN_GCODE = `\
G28                  ; Home all axes
T[TOOL_INDEX]        ; Select tool
G90                  ; Absolute XYZ
G1 Z5 F100           ; Z raise
M190 S[BED_TEMP]     ; Set and wait for bed temp
M109 S[HOTEND_TEMP]  ; Set and wait for hotend temp
;G29                 ; Auto bed leveling
M112                 ; Reading comprehension check! (emergency stop)`

  switch (true){
    case $('#START_GCODE_TYPE').val() == "custom" :
      $('#START_GCODE').val(CANNED_GCODE);
      break;
    case $('#START_GCODE_TYPE').val() == "custom-marlin" :
      $('#START_GCODE').val(MARLIN_GCODE);
      break;
    case $('#START_GCODE_TYPE').val() == "standalone" :
      $('#START_GCODE').val(STANDALONE_MACRO);
      break;
    case $('#START_GCODE_TYPE').val() == 'standalone_temp_passing' :
      $('#START_GCODE').val(STANDALONE_TEMP_PASSING_MACRO);
      break;
  }
  validate();
}

function toggleStartEndGcodeTypeDescriptions(){
    if ($('#START_GCODE_TYPE').val() == "custom"){
    $('#START_GCODE_TYPE_Description').html('');
  } else if ($('#START_GCODE_TYPE').val() == "standalone") {
    $('#START_GCODE_TYPE_Description').html(`\
<br>This option is for if you use a <u>standalone</u> start macro.<br><br>
It must contain <strong>all necessary preparatory g-codes!</strong><br>
(homing, quad gantry leveling, z offset, bed leveling, etc).<br><br>`);
  } else if ($('#START_GCODE_TYPE').val() == "standalone_temp_passing") {
    $('#START_GCODE_TYPE_Description').html(`\
<br>This option is for if you use a <u>standalone</u> start macro <strong>AND</strong> <a href=\"https://github.com/AndrewEllis93/Print-Tuning-Guide/blob/main/articles/passing_slicer_variables.md\"><u>have set up temperature variable passing!</u></a></p>
It must contain <strong>all necessary preparatory g-codes!</strong><br>
(homing, quad gantry leveling, z offset, bed leveling, etc).<br><br>`);
  } else {
    $('#START_GCODE_TYPE_Description').html('');
  }
}

function toggleFirmwareOptions(){
  var MARLIN_END_GCODE = `\
M107     ; Turn off fan
M400     ; Finish moving
M104 S0  ; Turn off hotend
M140 S0  ; Turn off bed
G91      ; Relative XYZ
G0 Z5    ; Move up 5mm
G90      ; Absolute XYZ
M84      ; Disable motors
M501     ; Load settings from EEPROM (to restore previous values)`

  var KLIPPER_END_GCODE = `\
PRINT_END ; End macro
RESTART   ; Restart Klipper to reset PA value`

  switch(true){
    case $('#FIRMWARE').val().includes('marlin') :
      $('#TOOL_INDEX').parents().eq(1).show()
      $('#EXTRUDER_NAME').parents().eq(1).hide()
      $('#STEPPING_HEADER').html('Linear Advance Stepping')
      $('#STEPPING_HEADER_BODY').html('')
      $('label[for=PA_START]').html('Start K Value')
      $('label[for=PA_END]').html('End K Value')
      $('label[for=PA_STEP]').html('K Value Increment')
      $('#START_GCODE_TYPE').parents().eq(1).hide()
      $('#END_GCODE').val(MARLIN_END_GCODE);
      break;
    default :
      $('#TOOL_INDEX').parents().eq(1).hide()
      $('#EXTRUDER_NAME').parents().eq(1).show()
      $('#STEPPING_HEADER').html('Pressure Advance Stepping')
      $('#STEPPING_HEADER_BODY').html(`\
<i>(Start with ~0 to ~0.<font color="red">
<strong><u>0</u></strong></font>8 for direct drive or ~0 to ~0.8 for bowden.)</i>`)
      $('label[for=PA_START]').html('PA Start Value')
      $('label[for=PA_END]').html('PA End Value')
      $('label[for=PA_STEP]').html('PA Increment')
      $('#START_GCODE_TYPE').parents().eq(1).show()
      $('#END_GCODE').val(KLIPPER_END_GCODE);
  }
}

function toggleFirmwareValues(){
    switch(true){
    case $('#FIRMWARE').val() === 'marlin-1.1.9' :
      $('#PA_START').val(0)
      $('#PA_END').val(0.08)
      $('#PA_STEP').val(0.005)
      $('#START_GCODE_TYPE').val('custom-marlin')
      break;
    case $('#FIRMWARE').val() === 'marlin-1.1.8' :
      $('#PA_START').val(0)
      $('#PA_END').val(4)
      $('#PA_STEP').val(0.2)
      $('#START_GCODE_TYPE').val('custom-marlin')
      break;
    case $('#FIRMWARE').val() === 'klipper' :
      $('#START_GCODE_TYPE').val('custom');
      $('#PA_START').val(0)
      $('#PA_END').val(0.08)
      $('#PA_STEP').val(0.005)
      break;
  }
  validate(true);
}

function togglePatternOptions(){
  for (var i = 1; i < $('#patternSettingsHead').children().length; i++) {
    if ($('#PATTERN_OPTIONS_ENABLE').is(':checked')) {
      $('#patternSettingsHead').children().eq(i).show()
    } else {
      $('#patternSettingsHead').children().eq(i).hide()
    }
  }
}

function toggleAnchorOptions(){
    if ($('#ANCHOR_OPTION').val() == "anchor_frame"){
    $('label[for=ANCHOR_PERIMETERS]').parent().show();
    $('#ANCHOR_PERIMETERS').parent().show();
    $('label[for=ANCHOR_LAYER_LINE_RATIO]').parent().show();
    $('#ANCHOR_LAYER_LINE_RATIO').parent().show();
    $('#anchorOptionDescription').html('<img style="width: auto; max-height: 200px;" src="./images/anchor_frame.png" alt="Anchor Frame" />')
  } else if ($('#ANCHOR_OPTION').val() == "anchor_layer") {
    $('label[for=ANCHOR_PERIMETERS]').parent().hide();
    $('#ANCHOR_PERIMETERS').parent().hide();
    $('label[for=ANCHOR_LAYER_LINE_RATIO]').parent().show();
    $('#ANCHOR_LAYER_LINE_RATIO').parent().show();
    $('#anchorOptionDescription').html('<img style="width: auto; max-height: 200px;" src="./images/anchor_layer.png" alt="Anchor Layer" />')
  } else {
    $('label[for=ANCHOR_PERIMETERS]').parent().hide();
    $('#ANCHOR_PERIMETERS').parent().hide();
    $('label[for=ANCHOR_LAYER_LINE_RATIO]').parent().hide();
    $('#ANCHOR_LAYER_LINE_RATIO').parent().hide();
    $('#anchorOptionDescription').html('<img style="width: auto; max-height: 200px;" src="./images/no_anchor.png" alt="No Anchor" />')
  }
}

function toggleZHop() {
  if ($('#ZHOP_ENABLE').is(':checked')) {
    $('label[for=ZHOP_HEIGHT]').parent().show();
    $('#ZHOP_HEIGHT').parent().show();
  } else {
    $('label[for=ZHOP_HEIGHT]').parent().hide();
    $('#ZHOP_HEIGHT').parent().hide();
  }
}

// show the calculated values at the bottom of the form
function displayCalculatedValues(action = 'show'){
  var body='';

  if (action == 'show'){
    body += `\
<strong>Print size X: </strong> ${Math.round10(FIT_WIDTH, -1)}mm<br>
<strong>Print size Y: </strong> ${Math.round10(FIT_HEIGHT, -1)}mm<br>
<strong>Pattern count: </strong> ${NUM_PATTERNS}<br>
<strong>${(FIRMWARE === 'klipper') ? 'PA' : 'LA'} values: </strong>`
    for (let i = 0; i < NUM_PATTERNS; i++){
      body += `${Math.round10((PA_START + i * PA_STEP),PA_round)}`;
      if (i != NUM_PATTERNS - 1){ // add comma separator if not last item in list
        body += ', '; 
      }
      else {
         body += '<br><br>';
      }
    }

    $('#information').html(body);
    $('#information').parent().show();
  } else {
    body = '';
    $('#information').html('');
    $('#information').parent().hide();
  }
}

// https://github.com/aligator/gcode-viewer
function render(gcode) {
    const TRANSPARENT_COLOR = new gcodeViewer.Color()
    const DEFAULT_COLOR = new gcodeViewer.Color('#0000ff')
    const ANCHOR_COLOR = new gcodeViewer.Color('#00ff00')

    let colorConfig = []

    gcode.split("\n").forEach(function(line, i) {
        let color
        if (line.includes("Draw anchor perimeter")) {
          color = ANCHOR_COLOR
        } else {
          color = DEFAULT_COLOR
        }
        if (colorConfig.length === 0 || color && colorConfig[colorConfig.length-1].color !== color) {
            colorConfig.push({toLine: i, color})
        } else {
            colorConfig[colorConfig.length - 1].toLine = i
        }
    });

    const renderer = new gcodeViewer.GCodeRenderer(gcode, 480, 360, new gcodeViewer.Color(0x808080))
    renderer.colorizer = new gcodeViewer.LineColorizer(colorConfig)
    renderer.travelWidth = 0 // disable rendering travel moves
    $('#gcode-viewer').empty().append(renderer.element())
    renderer.render()
    renderer.fitCamera()
}

// sanity checks for pattern / bed size
function validate(updateRender = false) {
  setVars();

  var testNaN = {
    // do not use parseInt or parseFloat for validating, since both
    // functions will have special parsing characteristics leading to
    // false numeric validation
    ANCHOR_LAYER_LINE_RATIO: $('#ANCHOR_LAYER_LINE_RATIO').val(),
    ANCHOR_PERIMETERS : $('#ANCHOR_PERIMETERS').val(),
    BED_TEMP: $('#BED_TEMP').val(),
    BED_X: $('#BED_X').val(),
    BED_Y: $('#BED_Y').val(),
    EXT_MULT: $('#EXT_MULT').val(),
    FAN_SPEED: $('#FAN_SPEED').val(),
    FAN_SPEED_FIRSTLAYER: $('#FAN_SPEED_FIRSTLAYER').val(),
    FILAMENT_DIAMETER: $('#FILAMENT_DIAMETER').val(),
    HEIGHT_FIRSTLAYER: $('#HEIGHT_FIRSTLAYER').val(),
    HEIGHT_LAYER: $('#HEIGHT_LAYER').val(),
    HEIGHT_PRINT: $('#HEIGHT_PRINT').val(),
    HOTEND_TEMP: $('#HOTEND_TEMP').val(),
    LINE_RATIO: $('#LINE_RATIO').val(),
    NOZZLE_DIAMETER: $('#NOZZLE_DIAMETER').val(),
    PATTERN_ANGLE: $('#PATTERN_ANGLE').val(),
    PATTERN_SIDE_LENGTH: $('#PATTERN_SIDE_LENGTH').val(),
    PATTERN_SPACING: $('#PATTERN_SPACING').val(),
    PA_END: $('#PA_END').val(),
    PA_START: $('#PA_START').val(),
    PA_STEP: $('#PA_STEP').val(),
    PERIMETERS: $('#PERIMETERS').val(),
    PRINT_ACCL: $('#PRINT_ACCL').val(),
    RETRACT_DIST: $('#RETRACT_DIST').val(),
    SPEED_FIRSTLAYER: $('#SPEED_FIRSTLAYER').val(),
    SPEED_PERIMETER: $('#SPEED_PERIMETER').val(),
    SPEED_RETRACT: $('#SPEED_RETRACT').val(),
    SPEED_TRAVEL: $('#SPEED_TRAVEL').val(),
    SPEED_UNRETRACT: $('#SPEED_UNRETRACT').val(),
    TOOL_INDEX: $('#TOOL_INDEX').val(),
    ZHOP_HEIGHT: $('#ZHOP_HEIGHT').val()
    //PRIME_EXT: $('#ENT_MULT_PRIME').val(),
    //PRIME_SPEED: $('#PRIME_SPEED').val(),
  }

  var decimals = getDecimals(parseFloat(testNaN['PA_STEP']));
  var invalid = 0;
  var validationFail = false;
  
  // Reset all warnings before re-check
  $('ANCHOR_LAYER_LINE_RATIO,#BED_TEMP,#BED_X,#BED_Y,#TOOL_INDEX,#END_GCODE,#EXT_MULT,#EXTRUDER_NAME,#FAN_SPEED,#FAN_SPEED_FIRSTLAYER,#FILAMENT_DIAMETER,#FILENAME,#HEIGHT_FIRSTLAYER,#HEIGHT_PRINT,#HOTEND_TEMP,#LAYER_HEIGHT,#LINE_RATIO,#NOZZLE_DIAMETER,#PATTERN_ANGLE,#PATTERN_SIDE_LENGTH,#PATTERN_SPACING,#PA_END,#PA_START,#PA_STEP,#PERIMETERS,#PRINT_ACCL,#RETRACT_DIST,#SPEED_FIRSTLAYER,#SPEED_PERIMETER,#SPEED_RETRACT,#SPEED_TRAVEL,#SPEED_UNRETRACT,#START_GCODE,#START_GCODE_TYPE,#ZHOP_HEIGHT').each((i,t) => {
    t.setCustomValidity('');
    const tid = $(t).attr('id');
    $(`label[for=${tid}]`).removeClass();
  });
  $('#warning1').hide();
  $('#warning2').hide();
  $('#warning3').hide();
  $('#warning4').hide();
  $('#startGcodeWarning').hide();
  $('#downloadButton').prop('disabled', false);
  $('#saveSettingsButton').prop('disabled', false);

  // Check for proper numerical values
  Object.keys(testNaN).forEach((k) => {
    if ((isNaN(testNaN[k]) && !isFinite(testNaN[k])) || testNaN[k].trim().length === 0 || testNaN[k] < 0) {
      $('label[for=' + k + ']').addClass('invalid');
      $('#warning3').text('Some values are not proper numbers. Check highlighted Settings.');
      $('#warning3').addClass('invalid');
      $('#warning3').show();
      validationFail = true;
    }
  });

  // Check text inputs
  if ($('#FILENAME').val() == '' || $('#FILENAME').val() == null) {
    $('label[for=FILENAME]').addClass('invalid');
    $('#warning2').text('File name cannot be blank.');
    $('#warning2').addClass('invalid');
    $('#warning2').show();
    validationFail = true;
  }

    // Check text inputs
  if ($('#EXTRUDER_NAME').val() == '' || $('#EXTRUDER_NAME').val() == null) {
    $('label[for=EXTRUDER_NAME]').addClass('invalid');
    $('#warning3').text('Extruder name cannot be blank.');
    $('#warning3').addClass('invalid');
    $('#warning3').show();
    validationFail = true;
  }
  
  if (!validationFail){ // only check if above checks pass
    // Check if pressure advance stepping is a multiple of the pressure advance Range
    if ((Math.round10(parseFloat(testNaN['PA_END']) - parseFloat(testNaN['PA_START']), PA_round) * Math.pow(10, decimals)) % (parseFloat(testNaN['PA_STEP']) * Math.pow(10, decimals)) !== 0) {
      $('label[for=PA_START]').addClass('invalid');
      $('label[for=PA_END]').addClass('invalid');
      $('label[for=PA_STEP]').addClass('invalid');
      $('#warning1').text('Your PA range cannot be cleanly divided. Check highlighted sttings.');
      $('#warning1').addClass('invalid');
      $('#warning1').show();
      invalid = 1;
      validationFail = true;
    } 
  }

  if (!validationFail){ // only check if above checks pass
    if (parseFloat(testNaN['PA_END']) - parseFloat(testNaN['PA_START']) < 0) { // Check if pressure advance stepping is a multiple of the pressure advance Range
      $('label[for=PA_START]').addClass('invalid');
      $('label[for=PA_END]').addClass('invalid');
      $('#warning1').text('Your PA start value cannot be higher than your PA end value. Check highlighted settings.');
      $('#warning1').addClass('invalid');
      $('#warning1').show();
      invalid = 1;
      validationFail = true;
    } 
  }
  
  if (!validationFail){ // only check if above checks pass
      // Check if pattern settings exceed bed size
      // too tall for round bed
      if (BED_SHAPE === 'Round' && (Math.sqrt(Math.pow(FIT_WIDTH, 2) + Math.pow(FIT_HEIGHT, 2)) > (parseInt(testNaN['BED_X']) - 5)) && FIT_HEIGHT > FIT_WIDTH) {
        $('label[for=PA_START]').addClass('invalid');
        $('label[for=PA_END]').addClass('invalid');
        $('label[for=PA_STEP]').addClass('invalid');
        $('label[for=PATTERN_SPACING]').addClass('invalid');
        $('label[for=PATTERN_ANGLE]').addClass('invalid');
        $('label[for=PATTERN_SIDE_LENGTH]').addClass('invalid');
        $('label[for=PERIMETERS]').addClass('invalid');
        $('label[for=BED_X]').addClass('invalid');
        $((invalid ? '#warning2' : '#warning1')).text('Your Pattern size (x: ' + Math.round(FIT_WIDTH) + ', y: ' + Math.round(FIT_HEIGHT) + ') exceeds your bed\'s diameter. Check highlighted settings.');
        $((invalid ? '#warning2' : '#warning1')).addClass('invalid');
        $((invalid ? '#warning2' : '#warning1')).show();
        validationFail = true;
      }

      // too wide for round bed
      if (BED_SHAPE === 'Round' && (Math.sqrt(Math.pow(FIT_WIDTH, 2) + Math.pow(FIT_HEIGHT, 2)) > (parseInt(testNaN['BED_X']) - 5)) && FIT_WIDTH > FIT_HEIGHT) {
        $('label[for=PA_START]').addClass('invalid');
        $('label[for=PA_END]').addClass('invalid');
        $('label[for=PA_STEP]').addClass('invalid');
        $('label[for=PATTERN_SPACING]').addClass('invalid');
        $('label[for=PATTERN_ANGLE]').addClass('invalid');
        $('label[for=PATTERN_SIDE_LENGTH]').addClass('invalid');
        $('label[for=PERIMETERS]').addClass('invalid');
        $('label[for=BED_X]').addClass('invalid');
        $((invalid ? '#warning2' : '#warning1')).text('Your Pattern size (x: ' + Math.round(FIT_WIDTH) + ', y: ' + Math.round(FIT_HEIGHT) + ') exceeds your bed\'s diameter. Check highlighted settings.');
        $((invalid ? '#warning2' : '#warning1')).addClass('invalid');
        $((invalid ? '#warning2' : '#warning1')).show();
        validationFail = true;
      }

      // too wide
      if (BED_SHAPE === 'Rect' && FIT_WIDTH > (parseInt(testNaN['BED_X']) - 5)) {
        $('label[for=PA_START]').addClass('invalid');
        $('label[for=PA_END]').addClass('invalid');
        $('label[for=PA_STEP]').addClass('invalid');
        $('label[for=PATTERN_SPACING]').addClass('invalid');
        $('label[for=PATTERN_ANGLE]').addClass('invalid');
        $('label[for=PATTERN_SIDE_LENGTH]').addClass('invalid');
        $('label[for=PERIMETERS]').addClass('invalid');
        $('label[for=BED_X]').addClass('invalid');
        $((invalid ? '#warning2' : '#warning1')).text('Your Pattern size (x: ' + Math.round(FIT_WIDTH) + ', y: ' + Math.round(FIT_HEIGHT) + ') exceeds your X bed size. Check highlighted settings.');
        $((invalid ? '#warning2' : '#warning1')).addClass('invalid');
        $((invalid ? '#warning2' : '#warning1')).show();
        validationFail = true;
      }

      // too tall
      if (BED_SHAPE === 'Rect' && FIT_HEIGHT > (parseInt(testNaN['BED_Y']) - 5)) {
        $('label[for=PA_START]').addClass('invalid');
        $('label[for=PA_END]').addClass('invalid');
        $('label[for=PA_STEP]').addClass('invalid');
        $('label[for=PATTERN_SPACING]').addClass('invalid');
        $('label[for=PATTERN_ANGLE]').addClass('invalid');
        $('label[for=PATTERN_SIDE_LENGTH]').addClass('invalid');
        $('label[for=PERIMETERS]').addClass('invalid');
        $('label[for=BED_Y]').addClass('invalid');
        $((invalid ? '#warning2' : '#warning1')).text('Your Pattern size (x: ' + Math.round(FIT_WIDTH) + ', y: ' + Math.round(FIT_HEIGHT) + ') exceeds your Y bed size. Check highlighted settings.');
        $((invalid ? '#warning2' : '#warning1')).addClass('invalid');
        $((invalid ? '#warning2' : '#warning1')).show();
        validationFail = true;
      }
  }

  // check start g-code for missing essential g-codes
  var message = '';
  $('#startGcodeWarning').hide();
  $('#startGcodeWarning').removeClass('invalid');
  $('#startGcodeWarning').html('');

  switch(true){
    case (!$('#START_GCODE').val().includes('[BED_TEMP]') && $('#START_GCODE_TYPE').val() === 'standalone_temp_passing') :
      message += "- <tt>[BED_TEMP]</tt><br>";
    case (!$('#START_GCODE').val().includes('[HOTEND_TEMP]') && $('#START_GCODE_TYPE').val() === 'standalone_temp_passing') :
      message += "- <tt>[HOTEND_TEMP]</tt><br>";
      break;
    case ($('#START_GCODE').val().match(/G28(?! Z)/gm) == null && !$('#START_GCODE_TYPE').val().includes('standalone')) :
      message += "- <tt>G28</tt><br>";
    case (!$('#START_GCODE').val().includes('M190 S[BED_TEMP]') && !($('#START_GCODE_TYPE').val() === 'standalone_temp_passing')) :
      message += "- <tt>M190 S[BED_TEMP]</tt><br>";
    case (!$('#START_GCODE').val().includes('M109 S[HOTEND_TEMP]') && !($('#START_GCODE_TYPE').val() === 'standalone_temp_passing')) :
      message += "- <tt>M109 S[HOTEND_TEMP]</tt><br>";
  }
  message

  if (!(message == '')){
    message = "Your start g-code does not contain:<br>" + message + "Please check your start g-code."
    $('#startGcodeWarning').html(message);
    $('#startGcodeWarning').addClass('invalid');
    $('#startGcodeWarning').show();
    $('label[for=START_GCODE]').addClass('invalid');
    $('#warning4').text('Problems were found in your start g-code. Check highlighted setting.');
    $('#warning4').addClass('invalid');
    $('#warning4').show();
    validationFail = true;
  }
  
  if (!validationFail){ // actions to take if all checks pass
    displayCalculatedValues();
    if (updateRender){  
      genGcode();
      render(pa_script);
    }
  } else { // actions to take on ANY failure
    $('#downloadButton').prop('disabled', true);
    $('#saveSettingsButton').prop('disabled', true);
    displayCalculatedValues('hide');
  }
}

$(window).load(() => {
  // create tab index dynamically
  $(':input:not(:hidden)').each(function(i) {
    $(this).attr('tabindex', i + 1);
  });

  toggleStartEndGcode();

  // Get localStorage data
  var lsSettings = window.localStorage.getItem('PA_SETTINGS');

  if (lsSettings) {
    var settings = jQuery.parseJSON(lsSettings);
    if (settings['SETTINGS_VERSION'] == SETTINGS_VERSION){ // only populate form with saved settings if version matches current
      $('#ANCHOR_LAYER_LINE_RATIO').val(settings['ANCHOR_LAYER_LINE_RATIO']);
      $('#ANCHOR_OPTION').val(settings['ANCHOR_OPTION']);
      $('#BED_SHAPE').val(settings['BED_SHAPE']);
      $('#BED_TEMP').val(settings['BED_TEMP']);
      $('#BED_X').val(settings['BED_X']);
      $('#BED_Y').val(settings['BED_Y']);
      $('#ECHO').prop('checked', settings['ECHO']);
      $('#END_GCODE').val(settings['END_GCODE']);
      $('#ENT_MULT_PRIME').val(settings['EXT_MULT_PRIME']);
      $('#EXTRUDER_NAME').val(settings['EXTRUDER_NAME']);
      $('#EXT_MULT').val(settings['EXT_MULT']);
      $('#FAN_SPEED').val(settings['FAN_SPEED']);
      $('#FAN_SPEED_FIRSTLAYER').val(settings['FAN_SPEED_FIRSTLAYER']);
      $('#FILAMENT_DIAMETER').val(settings['FILAMENT_DIAMETER']);
      $('#FILENAME').val(settings['FILENAME']);
      $('#FIRMWARE').val(settings['FIRMWARE']);
      $('#HEIGHT_FIRSTLAYER').val(settings['HEIGHT_FIRSTLAYER']);
      $('#HEIGHT_LAYER').val(settings['HEIGHT_LAYER']);
      $('#HEIGHT_PRINT').val(settings['HEIGHT_PRINT']);
      $('#HOTEND_TEMP').val(settings['HOTEND_TEMP']);
      $('#LINE_NO').prop('checked', settings['USE_LINENO']);
      $('#LINE_RATIO').val(settings['LINE_RATIO']);
      $('#NOZZLE_DIAMETER').val(settings['NOZZLE_DIAMETER']);
      $('#ORIGIN_CENTER').prop('checked', settings['ORIGIN_CENTER']);
      $('#PATTERN_ANGLE').val(settings['PATTERN_ANGLE']);
      $('#PATTERN_OPTIONS_ENABLE').prop('checked', settings['PATTERN_OPTIONS_ENABLE']);
      $('#PATTERN_SIDE_LENGTH').val(settings['PATTERN_SIDE_LENGTH']);
      $('#PATTERN_SPACING').val(settings['PATTERN_SPACING']);
      $('#PA_END').val(settings['PA_END']);
      $('#PA_START').val(settings['PA_START']);
      $('#PA_STEP').val(settings['PA_STEP']);
      $('#PERIMETERS').val(settings['PERIMETERS']);
      $('#PRIME').prop('checked', settings['USE_PRIME']);
      $('#PRIME_SPEED').val(settings['SPEED_PRIME']);
      $('#PRINT_ACCL').val(settings['ACCELERATION']);
      $('#PRINT_DIR').val(settings['PRINT_DIR']);
      $('#RETRACT_DIST').val(settings['RETRACT_DIST']);
      $('#SPEED_FIRSTLAYER').val(settings['SPEED_FIRSTLAYER']);
      $('#SPEED_PERIMETER').val(settings['SPEED_PERIMETER']);
      $('#SPEED_RETRACT').val(settings['SPEED_RETRACT']);
      $('#SPEED_TRAVEL').val(settings['SPEED_TRAVEL']);
      $('#SPEED_UNRETRACT').val(settings['SPEED_UNRETRACT']);
      $('#START_GCODE').val(settings['START_GCODE']);
      $('#START_GCODE_TYPE').val(settings['START_GCODE_TYPE']);
      $('#TOOL_INDEX').val(settings['TOOL_INDEX']);
      $('#ZHOP_ENABLE').prop('checked', settings['ZHOP_ENABLE']);
      $('#ZHOP_HEIGHT').val(settings['ZHOP_HEIGHT']);
    }
  }

  // run all toggles after loading user settings
  toggleBedShape();
  toggleFirmwareOptions();
  toggleZHop();
  togglePatternOptions();
  toggleAnchorOptions();
  toggleStartEndGcodeTypeDescriptions();
  //togglePrime();

  // validate input on page load
  // generates gcode and updates 3d preview if validations pass
  validate(true);

  // Focus the first field
  //$('#padv input:first').focus();
});