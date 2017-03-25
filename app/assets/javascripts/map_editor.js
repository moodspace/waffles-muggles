var helpText = [
    'Click to select an element on canvas.',
    'Draw a rectangle on canvas. Click to start a new point. Click again to finish.',
    'Draw a polygon on canvas. Click to start a new point. Double click to finish.',
    'Add interactivity to an area on canvas.',
    'Edit floor properties.',
    'Edit stack properties.'
];
var helpTextTimeout;
var meta_objects = {};

var libraries = [];
var floors = [];

var current_library = 3;
var current_floor = 7;

var saveCounter = 0;

function loadLibraries() {
    $.ajax({
        url: "/v1/libraries/",
        type: "GET",
        success: function(data) {
            libraries = data;

            $('#library-collection').html('');
            libraries.forEach(function(lib) {
                var item = $('<a href="javascript:void(0)" class="collection-item" data-library_id=' + lib.id + '>' + lib.name + '</a>').appendTo($('#library-collection'));
                if (lib.id === current_library) {
                    item.addClass('active');
                    loadFloors(lib.id);
                }
            });

            $('#library-collection>a').click(function() {
                var library_id = _.findIndex(libraries, {'id': $(this).data('library_id')});
                current_library = libraries[library_id].id;
                $('#library-collection>a').removeClass('active');
                $(this).addClass('active');
                current_floor = -1;
                $('#workspace').css('background-image', '');
                loadFloors(current_library);
            });

            $('.collapsible').collapsible('close', 0);
            $('.collapsible').collapsible('open', 0);
        }
    });
}

function loadFloors(library_id) {
    $.ajax({
        url: "/v1/floors/",
        data: {
            library_id: library_id
        },
        type: "GET",
        success: function(data) {
            floors = data;

            $('#floor-collection').html('');
            floors.forEach(function(floor) {
                var f_item = $('<a href="javascript:void(0)" class="collection-item" data-floor_id=' + floor.id + '>' + floor.name + '</a>').appendTo($('#floor-collection'));
                if (floor.id === current_floor) {
                    f_item.addClass('active');
                    $('#cfloor-name').val(floor.name);
                    Materialize.updateTextFields();
                }
            });

            $('#floor-collection>a').click(function() {
                var lib_name = libraries[_.findIndex(libraries, {'id': current_library})].name.split(' ')[0];
                var floor_id = _.findIndex(floors, {'id': $(this).data('floor_id')});
                var file_name = lib_name + '-Level' + floors[floor_id].name;
                $('#floor-collection>a').removeClass('active');
                $(this).addClass('active');
                current_floor = floors[floor_id].id;
                $('#workspace').css('background-image', "url('/assets/" + file_name + ".gif')");
                $('#cfloor-name').val(floors[floor_id].name);
                Materialize.updateTextFields();
            });

            $('.collapsible').collapsible('close', 0);
            $('.collapsible').collapsible('open', 0);
        }
    });
}

$(document).ready(function() {
    loadLibraries();

    $('.tool-options > .row').hide();
    $('.dropdown-button').dropdown();
    $('#workspace').height($('#workspace').height() - 64);
    initCanvas($('#workspace').width(), $('#workspace').height());
    $('.toolbox a.btn-flat').each(function(index) {
        $(this).click(function() {
            if (modebit !== index) {
                canvas.selectAll('.selected').classed('selected', false);
            }
            modebit = index;

            canvas.style('cursor', 'default').selectAll('*').style('cursor', 'default');

            if (modebit === 1 || modebit === 2) {
                canvas.style('cursor', 'crosshair').selectAll('*').style('cursor', 'crosshair');
            } else {
                canvas.style('cursor', 'default').selectAll('*').style('cursor', 'default');
                if (modebit === 3) {
                    canvas.selectAll('.cobject:not(.cstack)').style('cursor', 'pointer');
                }
                if (modebit === 5) {
                    canvas.selectAll('.cobject.cstack').style('cursor', 'pointer');
                }
            }
            $('.tool-options > .row').hide();
            $('.toolbox a.btn-flat').removeClass('light-blue');
            if (!canvas.selectAll('.selected').empty()) {
                $('.tool-options > .row:nth-child(' + index + ')').show();
            }

            // tool options available without selecting an element
            if (modebit === 4) {
                $('.tool-options > .row:nth-child(' + index + ')').show();
            }
            $(this).addClass('light-blue');
            showHelp(helpText[index]);
        });
    });

    $('#viewmode-toggle').change(function() {
        if (this.checked) {
            canvas.selectAll('g').classed('hidden', false);
        } else {
            canvas.selectAll('g').classed('hidden', true);
        }
    });

    $('#nav-undo').click(function() {
        if (objects.length === 0) {
            return;
        }
        var obj = objects.pop();
        if (obj.type !== 'stacks') {
            $('#' + obj.id).remove();
        } else {
            canvas.select('g[for="' + obj.id + '"]').remove();
        }
        objects_redo.push(obj);
    });

    $('#nav-redo').click(function() {
        if (objects_redo.length === 0) {
            return;
        }
        var obj = objects_redo.pop();
        switch (obj.type) {
            case 'rect':
                var rect = canvas.append('rect');
                rect.attrs(obj.data);
                // rect redrawn and restored
                objects.push(obj);
                confirmNewShape(rect, obj.id, {redo: true});
                break;
            case 'polygon':
                var polygon = canvas.append('polygon');
                polygon.attrs(obj.data);
                // rect redrawn and restored
                objects.push(obj);
                confirmNewShape(polygon, obj.id, {redo: true});
                break;
            case 'stacks':
                var group = canvas.append('g').attr('for', obj.id);
                obj.data.forEach(function(r) {
                    var rect = group.append('rect').attrs(r.data).classed('cstack', true);
                    var r_center = [];
                    r_center[0] = r.data.x + r.data.width * 0.5;
                    r_center[1] = r.data.y + r.data.height * 0.5;
                    rect.attr('transform', 'rotate(' + r.data.rotation + ' ' + r_center[0] + ' ' + r_center[1] + ')');
                    confirmNewShape(rect, r.id, {
                        stroke: '#0AC',
                        redo: true
                    });
                });
                // stacks redrawn and restored
                objects.push(obj);
                break;
            default:

        }
    });

    $('.row.cmark input').change(function() {
        var shape = canvas.selectAll('.selected');
        initStacksInShape(shape, $('#cmark-rows').val(), $('#cmark-rotation').val());
    });

    $('.row.crect input').change(function() {
        var shape = canvas.selectAll('.selected');
        shape.attr('x', $('#crect-x').val());
        shape.attr('y', $('#crect-y').val());
        shape.attr('width', $('#crect-width').val());
        shape.attr('height', $('#crect-height').val());
        objects = objects.map(function(obj) {
            if (obj.id === shape.attr('id')) {
                var new_obj = _.clone(obj);
                new_obj.data = {
                    x: parseInt(shape.attr('x')),
                    y: parseInt(shape.attr('y')),
                    width: parseInt(shape.attr('width')),
                    height: parseInt(shape.attr('height'))
                };
                return new_obj;
            } else {
                return obj;
            }
        });
    });

    $('.row.cpolygon input').change(function() {
        var shape = canvas.selectAll('.selected');
        shape.attr('points', $('#cpolygon-points').val());
    });

    $('#cfloor-btn-set').click(function() {
        modebit = 4;
        if (meta_objects.floor_border) {
            canvas.select('polygon[id="' + meta_objects.floor_border.id + '"]').remove();
        }
        meta_objects.floor_border = undefined;
        $(this).addClass('disabled');
        canvas.style('cursor', 'crosshair');
    });

    $('#btn-output-JSON').click(function() {
        $('#box-code-pop').html(JSON.stringify(exportFloorData(), null, '  '));
        $('.modal').modal();
        $('#code-popup').modal('open');
        $('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });
    });

    $('#btn-output-save').click(function() {
        var data = exportFloorData();
        saveCounter = data.stacks.length + 1;
        $.ajax({
            url: "/v1/floors",
            type: "PUT",
            dataType: "json",
            data: {
                "id": current_floor,
                "name": data.floor.name,
                "size_x": data.floor.size_x,
                "size_y": data.floor.size_y,
                "geojson": data.floor.geojson,
                "library": current_library
            },
            success: function(data) {
                if (--saveCounter === 0) {
                    showHelp('Save complete!');
                }
            }
        });

        data.stacks.forEach(function(s) {
            $.ajax({
                url: "/v1/stacks",
                type: "POST",
                dataType: "json",
                data: {
                    "cx": s.cx,
                    "cy": s.cy,
                    "lx": s.lx,
                    "ly": s.ly,
                    "rotation": s.rotation,
                    "geojson": "",
                    "startClass": s.startClass,
                    "startSubclass": s.startSubclass,
                    "endClass": s.endClass,
                    "endSubclass": s.endSubclass,
                    "oversize": s.oversize,
                    "floor": current_floor
                },
                success: function(data) {
                    if (--saveCounter === 0) {
                        showHelp('Save complete!');
                    }
                }
            });
        });
    });
});

function offsetPoints(points, dx, dy) {
    return points.map(function(p) {
        return [
            p[0] + dx,
            p[1] + dy
        ];
    });
}

function offsetStack(stackMeta, dx, dy) {
    var newMeta = _.clone(stackMeta);
    newMeta.cx = newMeta.cx + dx;
    newMeta.cy = newMeta.cy + dy;
    return newMeta;
}

function exportFloorData() {
    if (!meta_objects.floor_border) {
        return {floor: {}, stacks: []};
    }
    var floorJson = {};
    var floorPoints = pointsToArray(meta_objects.floor_border.data.points);

    var offset_x = d3.min(floorPoints, function(e) {
        return e[0];
    });
    var offset_y = d3.min(floorPoints, function(e) {
        return e[1];
    });

    floorJson = {
        name: $('#cfloor-name').val(),
        size_x: d3.max(floorPoints, function(e) {
            return e[0];
        }) - offset_x,
        size_y: d3.max(floorPoints, function(e) {
            return e[1];
        }) - offset_y,
        geojson: JSON.stringify({
            type: "polygon",
            coordinates: offsetPoints(floorPoints, -offset_x, -offset_y)
        })
    };

    var stacksJson = [];
    objects.forEach(function(obj) {
        if (obj.type === 'stacks') {
            obj.data.forEach(function(stack) {
                stacksJson.push(offsetStack(stack.meta, -offset_x, -offset_y));
            });
        }
    });

    return {floor: floorJson, stacks: stacksJson};
}

var canvas;
var modebit = 0; // 0: pointer, 1: rect, 2: poly, 3: mark, 4: layer, 5: stack
var objects = [];
var objects_redo = [];

function showHelp(help) {
    $('.help-text').html('<span class="white-text">' + help + '</span>');
    $('.help-text').fadeIn();
    helpTextTimeout
        ? clearInterval(helpTextTimeout)
        : false;
    helpTextTimeout = setTimeout(function() {
        $('.help-text').fadeOut();
    }, 5000);
}

function initCanvas(w, h) {
    // var x = d3.scaleLinear().domain([0, d3.max(data)]).range([0, width]);
    canvas = d3.select('#canvas').attr('width', w).attr('height', h);
    var gridLine;
    var gridNum = [
        Math.floor(w / 50),
        Math.floor(h / 50)
    ];
    for (var i = 1; i <= gridNum[1]; i++) {
        gridLine = canvas.append('line').attrs({
            x1: 0,
            x2: w,
            y1: i * 50,
            y2: i * 50
        });
        gridLine.attrs({'stroke-dasharray': '1, 5', 'stroke-width': '1', 'stroke': '#AAA'});
    }

    for (var j = 1; j <= gridNum[0]; j++) {
        gridLine = canvas.append('line').attrs({
            y1: 0,
            y2: h,
            x1: j * 50,
            x2: j * 50
        });
        gridLine.attrs({'stroke-dasharray': '1, 5', 'stroke-width': '1', 'stroke': '#AAA'});
    }

    canvas.on('click', function() {
        var coords = d3.mouse(this);
        switch (modebit) {
            case 1:
                var active_rect = canvas.select('rect.active');
                if (active_rect.empty()) {
                    var rect = canvas.append('rect').classed('active', true);
                    rect.attrs({'x': coords[0], 'y': coords[1], 'stroke-width': '1', 'stroke': '#F66', 'fill': 'rgba(239, 108, 0, 0.5)'});
                    rect.attrs({'x0': coords[0], 'y0': coords[1]});
                } else {
                    var rect_w = Math.abs(coords[0] - active_rect.attr('x0'));
                    var rect_h = Math.abs(coords[1] - active_rect.attr('y0'));
                    if (coords[0] < active_rect.attr('x0')) {
                        active_rect.attr('x', coords[0]);
                    } else {
                        active_rect.attr('x', active_rect.attr('x0'));
                    }
                    if (coords[1] < active_rect.attr('y0')) {
                        active_rect.attr('y', coords[1]);
                    } else {
                        active_rect.attr('y', active_rect.attr('y0'));
                    }
                    active_rect.attr('width', rect_w).attr('height', rect_h);
                    // rect created and stored
                    var rid = randomId();
                    objects.push({
                        id: 'canvas-e-' + rid,
                        type: 'rect',
                        meta: {
                            rows: 0,
                            rotation: 0
                        },
                        data: {
                            x: parseInt(active_rect.attr('x')),
                            y: parseInt(active_rect.attr('y')),
                            width: parseInt(active_rect.attr('width')),
                            height: parseInt(active_rect.attr('height'))
                        }
                    });
                    confirmNewShape(active_rect, rid);
                }
                break;
            case 2:
                var active_polygon = canvas.select('polygon.active');
                if (active_polygon.empty()) {
                    canvas.append('polygon').classed('active', true).attrs({'points': coords.join(','), 'stroke-width': '1', 'stroke': '#F66', 'fill': 'rgba(239, 108, 0, 0.5)'});
                } else {
                    active_polygon.attr('points', active_polygon.attr('points') + ' ' + coords.join(','));
                }
                break;
            case 4:
                if (!$('#cfloor-btn-set').hasClass('disabled')) {
                    break;
                }
                var active_fb_polygon = canvas.select('polygon.active_fb');
                if (active_fb_polygon.empty()) {
                    canvas.insert('polygon', ':first-child').classed('active_fb', true).attrs({'points': coords.join(','), 'stroke-width': '1', 'stroke': '#F66', 'fill': 'rgba(239, 108, 0, 0.5)'});
                } else {
                    active_fb_polygon.attr('points', active_fb_polygon.attr('points') + ' ' + coords.join(','));
                }
                break;
            default:

        }

    });

    canvas.on('mousemove', function() {
        var coords = d3.mouse(this);
        switch (modebit) {
            case 1:
                var active_rect = canvas.select('rect.active');
                if (!active_rect.empty()) {
                    var rect_w = Math.abs(coords[0] - active_rect.attr('x0'));
                    var rect_h = Math.abs(coords[1] - active_rect.attr('y0'));
                    if (coords[0] < active_rect.attr('x0')) {
                        active_rect.attr('x', coords[0]);
                    } else {
                        active_rect.attr('x', active_rect.attr('x0'));
                    }
                    if (coords[1] < active_rect.attr('y0')) {
                        active_rect.attr('y', coords[1]);
                    } else {
                        active_rect.attr('y', active_rect.attr('y0'));
                    }
                    active_rect.attr('width', rect_w).attr('height', rect_h);
                }
                break;
            case 2:
                var active_polygon = canvas.select('polygon.active');
                if (!active_polygon.empty()) {
                    active_polygon.attr('points', active_polygon.attr('points').replace(/\s+[-\d\.]+,[-\d\.]+$/, '') + ' ' + coords.join(','));
                }
                break;
            case 4:
                var active_fb_polygon = canvas.select('polygon.active_fb');
                if (!active_fb_polygon.empty()) {
                    active_fb_polygon.attr('points', active_fb_polygon.attr('points').replace(/\s+[-\d\.]+,[-\d\.]+$/, '') + ' ' + coords.join(','));
                }
                break;
            default:

        }
    });

    canvas.on('dblclick', function() {
        var coords = d3.mouse(this);

        switch (modebit) {
            case 2:
                var active_polygon = canvas.select('polygon.active');
                if (!active_polygon.empty()) {
                    var newPoints = active_polygon.attr('points') + ' ' + coords.join(',');
                    newPoints = arrayToPoints(prunePoints(pointsToArray(newPoints)));
                    active_polygon.attr('points', newPoints);
                    // polygon created and stored
                    var rid = randomId();
                    objects.push({
                        id: 'canvas-e-' + rid,
                        type: 'polygon',
                        meta: {
                            rows: 0,
                            rotation: 0
                        },
                        data: {
                            points: active_polygon.attr('points')
                        }
                    });
                    confirmNewShape(active_polygon, rid);
                }
                break;
            case 4:
                var active_fb_polygon = canvas.select('polygon.active_fb');
                if (!active_fb_polygon.empty()) {
                    var newPoints = active_fb_polygon.attr('points') + ' ' + coords.join(',');
                    newPoints = arrayToPoints(prunePoints(pointsToArray(newPoints)));
                    active_fb_polygon.attr('points', newPoints).classed('fb', true);
                    // polygon created and stored
                    var rid = randomId();
                    meta_objects.floor_border = {
                        type: 'f_border',
                        id: 'canvas-e-' + rid,
                        data: {
                            points: active_fb_polygon.attr('points')
                        }
                    };
                    confirmNewShape(active_fb_polygon, rid, {readonly: true});
                }
                $('#cfloor-btn-set').removeClass('disabled');
                canvas.style('cursor', 'default').selectAll('*').style('cursor', 'default');
                break;
            default:

        }
    });
}

function pointsToArray(strPoints) {
    return strPoints.split(' ').map(function(p) {
        return [
            parseInt(p.split(',')[0]),
            parseInt(p.split(',')[1])
        ];
    });
}

function rectToArray(rect) {
    var attrs = [
        parseFloat(rect.attr('x')),
        parseFloat(rect.attr('y')),
        parseFloat(rect.attr('width')),
        parseFloat(rect.attr('height'))
    ];
    return [
        [
            attrs[0], attrs[1]
        ],
        [
            attrs[0] + attrs[2],
            attrs[1]
        ],
        [
            attrs[0] + attrs[2],
            attrs[1] + attrs[3]
        ],
        [
            attrs[0], attrs[1] + attrs[3]
        ]
    ];
}

function arrayToPoints(points) {
    return points.map(function(p) {
        return p[0] + ',' + p[1];
    }).join(' ');
}

function prunePoints(points) {
    var ret = [];
    var lastPoint = points[0];
    ret.push(lastPoint);
    points.unshift();
    points.forEach(function(p) {
        if (Math.abs(lastPoint[0] - p[0]) > 5 || Math.abs(lastPoint[1] - p[1]) > 5) {
            if (Math.abs(lastPoint[0] - p[0]) <= 5) {
                ret.push([lastPoint[0], p[1]]);
            } else if (Math.abs(lastPoint[1] - p[1]) <= 5) {
                ret.push([p[0], lastPoint[1]]);
            } else {
                ret.push(p);
            }
        }
        lastPoint = p;
    });
    return ret;
}

function confirmNewShape(shape, id, settings) {
    id = id.replace('canvas-e-', '');
    shape.classed('active', false);
    shape.classed('active_fb', false);
    if (!settings || !settings.readonly) {
        shape.classed('cobject', true);
    }
    shape.attrs({
        'id': 'canvas-e-' + id,
        'stroke': settings && settings.stroke
            ? settings.stroke
            : '#F66',
        'fill': settings && settings.readonly
            ? 'transparent'
            : 'rgba(38, 50, 56, 0.5)'
    });
    if (!settings || !settings.redo) {
        objects_redo = [];
    }

    if (!settings || !settings.readonly) {
        addClickHandlerToShape(shape);
    }
    switch (modebit) {
        case 1:
            selectRect(shape.attr('id'));
            break;
        case 2:
            selectPolygon(shape.attr('id'));
            break;
        default:

    }
}

function selectRect(id) {
    canvas.selectAll('.selected').classed('selected', false);
    $('#' + id).addClass('selected');
    $('#crect-x').val($('#' + id).attr('x'));
    $('#crect-y').val($('#' + id).attr('y'));
    $('#crect-width').val($('#' + id).attr('width'));
    $('#crect-height').val($('#' + id).attr('height'));
    $('.tool-options > .row').hide();
    $('.tool-options > .row:nth-child(1)').show();
    Materialize.updateTextFields();
}

function selectPolygon(id) {
    canvas.selectAll('.selected').classed('selected', false);
    $('#' + id).addClass('selected');
    $('#cpolygon-points').val($('#' + id).attr('points'));
    $('.tool-options > .row').hide();
    $('.tool-options > .row:nth-child(2)').show();
    Materialize.updateTextFields();
}

function showMarkTool(id) {
    canvas.selectAll('.selected').classed('selected', false);
    $('#' + id).addClass('selected');
    var objIdx = _.findIndex(objects, function(o) {
        return o.id === id && o.type !== 'stacks';
    });
    $('#cmark-rows').val(objects[objIdx].meta.rows);
    $('#cmark-rotation').val(objects[objIdx].meta.rotation);
    $('.tool-options > .row:nth-child(' + modebit + ')').show();
    Materialize.updateTextFields();
}

function showStackTool(id) {
    canvas.selectAll('.selected').classed('selected', false);
    $('#' + id).addClass('selected');
    // $('#cmark-rows').val($('#' + id).attr('rows'));
    // $('#cmark-rotation').val($('#' + id).attr('rotation'));
    $('.tool-options > .row:nth-child(' + modebit + ')').show();
    Materialize.updateTextFields();
}

function addClickHandlerToShape(e) {
    e.on('click', function() {
        if (!e.classed('cobject')) {
            return;
        }
        switch (modebit) {
            case 0:
                if (e.attr('points')) {
                    selectPolygon(e.attr('id'));
                } else if (e.classed('cobject') && e.attr('x')) {
                    selectRect(e.attr('id'));
                }
                break;
            case 3:
                if (!e.classed('cstack')) {
                    showMarkTool(e.attr('id'));
                }
                break;
            case 5:
                if (e.classed('cstack')) {
                    showStackTool(e.attr('id'));
                }
                break;
            default:

        }
    });
}

var row_thickness = 10;

function initStacksInShape(e, rows, rotation) {
    rows = parseInt(rows);
    if (_.isNaN(rows) || rows <= 0) {
        return;
    }
    rotation = parseInt(rotation);
    if (_.isNaN(rotation) || rotation < 0 || rotation > 360) {
        return;
    }

    var objIdx = _.findIndex(objects, function(o) {
        return o.id === e.attr('id') && o.type !== 'stacks';
    });
    objects[objIdx].meta.rows = rows;
    objects[objIdx].meta.rotation = rotation;

    $('#cmark-rows').val(rows);
    $('#cmark-rotation').val(rotation);

    canvas.select('g[for="' + e.attr('id') + '"]').remove();
    new_objects = [];
    objects.forEach(function(obj) {
        if (obj.type !== 'stacks' || obj.id !== e.attr('id')) {
            new_objects.push(obj);
        }
    });
    objects = new_objects;

    var polygon = e.attr('points')
        ? pointsToArray(e.attr('points'))
        : rectToArray(e);
    var stacks = [];
    var theta = Math.PI * rotation / 180;
    var gamma = Math.PI / 2 - theta;

    var centeroid = d3.polygonCentroid(polygon);
    var row_normal_ends = [centeroid.slice(), centeroid.slice()];
    var row_ends = [centeroid.slice(), centeroid.slice()];
    while (d3.polygonContains(polygon, row_normal_ends[1])) {
        row_normal_ends[1][0] += Math.cos(gamma);
        row_normal_ends[1][1] += Math.sin(gamma);
    }
    while (d3.polygonContains(polygon, row_normal_ends[0])) {
        row_normal_ends[0][0] -= Math.cos(gamma);
        row_normal_ends[0][1] -= Math.sin(gamma);
    }

    while (d3.polygonContains(polygon, row_ends[1])) {
        // rhs
        row_ends[1][0] += Math.cos(theta);
        row_ends[1][1] -= Math.sin(theta);
    }
    while (d3.polygonContains(polygon, row_ends[0])) {
        // lhs
        row_ends[0][0] -= Math.cos(gamma);
        row_ends[0][1] += Math.sin(gamma);
    }

    var centeroid_row_len = Math.sqrt(Math.pow(row_ends[0][0] - row_ends[1][0], 2) + Math.pow(row_ends[0][1] - row_ends[1][1], 2));

    var row_spacing = Math.sqrt(Math.pow(row_normal_ends[0][0] - row_normal_ends[1][0], 2) + Math.pow(row_normal_ends[0][1] - row_normal_ends[1][1], 2));
    row_spacing = row_spacing / rows - row_thickness;

    var rect_center = [
        centeroid[0], centeroid[1] - 0.5 * rows * row_thickness - 0.5 * (rows - 1) * row_spacing
    ];

    var group = canvas.append('g').attr('for', e.attr('id'));
    var data_stacks = [];
    for (var i = 0; i < rows; i++) {
        var r = centeroid[1] - rect_center[1];
        rect_center_rot = [
            rect_center[0] + r * Math.cos(gamma),
            rect_center[1] + r - r * Math.sin(gamma)
        ];

        var rid = randomId();

        var rect = group.append('rect').attrs({
            'x': rect_center_rot[0] - centeroid_row_len * 0.5,
            'y': rect_center_rot[1] - row_thickness * 0.5,
            'width': centeroid_row_len,
            'height': row_thickness
        }).classed('cstack', true);

        rect.attr('transform', 'rotate(' + rotation + ' ' + rect_center_rot[0] + ' ' + rect_center_rot[1] + ')');

        data_stacks.push({
            type: 'stack',
            id: 'canvas-e-' + rid,
            meta: {
                'cx': rect_center_rot[0],
                'cy': rect_center_rot[1],
                'lx': centeroid_row_len,
                'ly': row_thickness,
                'rotation': rotation,
                'oversize': 0,
                'startClass': 'A',
                'startSubclass': 0,
                'endClass': 'Z',
                'endSubclass': 0
            },
            data: {
                'x': parseFloat(rect.attr('x')),
                'y': parseFloat(rect.attr('y')),
                'width': parseFloat(rect.attr('width')),
                'height': parseFloat(rect.attr('height')),
                'rotation': parseFloat(rotation)
            }
        });

        confirmNewShape(rect, rid, {stroke: '#0AC'});

        rect_center[1] += (row_thickness + row_spacing);
    }

    // stacks created and stored
    objects.push({type: 'stacks', id: e.attr('id'), data: data_stacks});
}

function randomId() {
    return Math.ceil(Math.random() * 100) + '-' + Math.ceil(Math.random() * 100) + '-' + Math.ceil(Math.random() * 100);
}
