function drawFloor(ctx, size, w, h, json) {
    ctx.beginPath();
    ctx.rect(size.scaleX(0), size.scaleY(0), size.scale(w), size.scale(h));
    ctx.closePath();
    ctx.fillStyle = '#F4F2EF';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.beginPath();
    var geojson = JSON.parse(json);
    ctx.moveTo(size.scaleX(geojson.coordinates[0][0]), size.scaleY(geojson.coordinates[0][1]));
    ctx.lineWidth = 1;
    geojson.coordinates.forEach(function(coords) {
        ctx.lineTo(size.scaleX(coords[0]), size.scaleY(coords[1]));
    });
    ctx.closePath();
    ctx.stroke();
}

function drawStack(ctx, size, stack, highlighted) {
    ctx.translate(size.scaleX(stack.cx), size.scaleY(stack.cy));
    ctx.rotate(stack.rotation);
    ctx.beginPath();
    ctx.rect(-size.scale(stack.lx) / 2, -size.scale(stack.ly) / 2, size.scale(stack.lx), size.scale(stack.ly));
    ctx.closePath();
    ctx.fillStyle = highlighted ? 'red' : '#FAF5ED';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.rotate(-stack.rotation);
    ctx.translate(-size.scaleX(stack.cx), -size.scaleY(stack.cy));
}

function updateStack(stack) {
    $('#text-stack-id').text(stack.library.name + " " + stack.floor.name + " Stack " + stack.id);
    $('#text-stack-range').text(stack.startClass + stack.startSubclass + " - " + stack.endClass + stack.endSubclass);
    $('#text-stack-topic').text("LOL");
    $('#text-stack-topic-more').text("LOLOLOL");
}

function loadMap(stackId) {
    $.ajax({
        url: "/v1/stacks/" + stackId, // Route to the Script Controller method
        type: "GET",
        success: function(s) {
            var canvasW = $('#map-wrapper > .floor-map-wrapper').innerWidth();
            var canvasH = $('#map-wrapper').innerHeight();
            if ($('#map-wrapper > .floor-map-wrapper').position().top > 50) {
                canvasH -= $('#map-wrapper > .stack-box-wrapper').innerHeight();
            }

            $('#map-canvas').attr('width', canvasW);
            $('#map-canvas').attr('height', canvasH);
            var map_ctx = $('#map-canvas')[0].getContext('2d');
            var scale = Math.min(canvasW / s.floor.size_x, canvasH / s.floor.size_y);
            var ctx_size = {
                width: canvasW,
                height: canvasH,
                scale: function(v) {
                    return scale * v;
                },
                scaleX: function(v) {
                    return canvasW / 2 - scale * s.floor.size_x / 2 + scale * v;
                },
                scaleY: function(v) {
                    return canvasH / 2 - scale * s.floor.size_y / 2 + scale * v;
                }
            };
            drawFloor(map_ctx, ctx_size, s.floor.size_x, s.floor.size_y, s.floor.geojson);
            updateStack(s);
            $.ajax({
                url: "/v1/stacks?floor_id=" + s.floor.id, // Route to the Script Controller method
                type: "GET",
                success: function(all_s) {
                    all_s.forEach(function(e_s) {
                        drawStack(map_ctx, ctx_size, e_s, e_s.id === s.id);
                    });
                }
            });
        }
    });
}

$(document).ready(function() {
    var callno = $('#map-wrapper').data('callno');
    var lib_id = 4;
    $.ajax({
        url: "/v1/search", // Route to the Script Controller method
        type: "GET",
        dataType: "json",
        data: {
            keyword: callno
        },
        success: function(data) {
            data.forEach(function(search_result) {
                if (search_result.result.library.id === lib_id) {
                    loadMap(search_result.result_id);
                    return;
                }
            });
        }
    });
});
