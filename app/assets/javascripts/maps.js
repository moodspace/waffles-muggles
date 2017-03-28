let mapCtx;
let bibData;

function drawFloor(size, w, h, json) {
  const geojson = JSON.parse(json);

  mapCtx.beginPath();
  mapCtx.rect(size.scaleX(0), size.scaleY(0), size.scale(w), size.scale(h));
  mapCtx.closePath();
  mapCtx.fillStyle = '#E4E4E4';
  mapCtx.fill();
  mapCtx.lineWidth = 3;
  mapCtx.strokeStyle = '#B1BBBC';
  mapCtx.stroke();

  mapCtx.beginPath();
  mapCtx.moveTo(size.scaleX(geojson.coordinates[0][0]), size.scaleY(geojson.coordinates[
    0][1]));
  geojson.coordinates.forEach((coords) => {
    mapCtx.lineTo(size.scaleX(coords[0]), size.scaleY(coords[1]));
  });
  mapCtx.closePath();
  mapCtx.stroke();
}

function drawStack(size, stack, highlighted) {
  mapCtx.translate(size.scaleX(stack.cx), size.scaleY(stack.cy));
  mapCtx.rotate((stack.rotation * Math.PI) / 180);
  mapCtx.beginPath();
  mapCtx.rect(-size.scale(stack.lx) * 0.5, -size.scale(stack.ly) * 0.5, size.scale(
    stack.lx), size.scale(stack.ly));
  mapCtx.closePath();
  mapCtx.fillStyle = highlighted ?
    'red' :
    '#FAF5ED';
  mapCtx.fill();
  mapCtx.lineWidth = 1;
  mapCtx.strokeStyle = 'black';
  mapCtx.stroke();
  mapCtx.rotate((-stack.rotation * Math.PI) / 180);
  mapCtx.translate(-size.scaleX(stack.cx), -size.scaleY(stack.cy));
}

function updateStack(s) {
  $('#text-floor-id').html(
    `<h1>${s.library.name} <small>${s.floor.name}</small></h1>`);
  $('#text-stack-id').text(`Stack ${s.id}`);
  $('#text-stack-range').text(
    `${s.startClass}${s.startSubclass || ''} ${s.startSubclass2 || ''}
    - ${s.endClass}${s.endSubclass || ''} ${s.endSubclass2 || ''}`,
  );
}

function loadMap(stackId) {
  $.ajax({
    url: `/v1/stacks/${stackId}`, // Route to the Script Controller method
    type: 'GET',
    success: (s) => {
      const canvasW = $('#map-canvas').parent().innerWidth();
      let canvasH = $('#map-wrapper').innerHeight();
      if ($('#map-wrapper > .floor-map-wrapper').position().top > 50) {
        canvasH -= $('#map-wrapper > .stack-box-wrapper').innerHeight();
      }

      $('#map-canvas').attr('width', canvasW);
      $('#map-canvas').attr('height', canvasH);
      mapCtx = $('#map-canvas')[0].getContext('2d');
      const scale = Math.min(canvasW / s.floor.size_x, canvasH / s.floor.size_y);
      const mapScales = {
        width: canvasW,
        height: canvasH,
        scale: v => scale * v,
        scaleX: v => ((canvasW * 0.5) - (scale * s.floor.size_x * 0.5)) +
          (scale * v),
        scaleY: v => ((canvasH * 0.5) - (scale * s.floor.size_y * 0.5)) +
          (scale * v),
      };
      drawFloor(mapScales, s.floor.size_x, s.floor.size_y, s.floor
        .geojson);
      updateStack(s);
      $.ajax({
        url: `/v1/stacks?floor_id=${s.floor.id}`, // Route to the Script Controller method
        type: 'GET',
        success: (allStacks) => {
          allStacks.forEach((stack) => {
            drawStack(mapScales, stack, stack.id === s.id);
          });
        },
      });
    },
  });
}

function loadHoldings() {
  $.ajax({
    url: `/holdings/${bibId}`,
    type: 'GET',
    success: (data) => {
      const d = data[0].item_status.itemdata[0];
      if (!d) {
        return;
      }
      const itemData = {
        callNumber: d.callNumber || null,
        caption: d.caption,
        chron: d.chron,
        copy: d.copy,
        enumeration: d.enumeration,
        excludeLocationId: d.exclude_location_id,
        freeText: d.freeText,
        href: d.href,
        itemBarcode: d.itemBarcode,
        itemId: parseInt(d.itemid, 10),
        itemNote: d.itemNote,
        itemStatus: d.itemStatus,
        location: d.location,
        locationId: parseInt(d.location_id, 10),
        onReserve: d.onReserve !== 'N',
        permLocation: d.permLocation,
        spineLabel: d.spineLabel,
        tempLocation: d.tempLocation,
        tempType: parseInt(d.tempType, 10),
        typeCode: parseInt(d.typeCode, 10),
        typeDesc: d.typeDesc,
        year: d.year,
      };

      bibData = itemData;
      console.log(bibData)
      if (bibData.itemStatus.toLowerCase() === 'not charged') {
        $('#bibCheckedOut').addClass('hidden');
      } else if (bibData.itemStatus.toLowerCase().includes('due')) {
        $('#bibCheckedOut').removeClass('hidden');
      }

      if (!bibData.onReserve) {
        $('#bibOnReserve').addClass('hidden');
      } else {
        $('#bibOnReserve').removeClass('hidden');
      }
      $('#text-bib-name').text(d.callNumber);
    },
  });
}

$(document).ready(() => {
  $.ajax({
    url: '/v1/search', // Route to the Script Controller method
    type: 'GET',
    dataType: 'json',
    data: {
      keyword: callNo,
    },
    success: (data) => {
      let found = false;
      data.forEach((searchResult) => {
        if (!found && searchResult.result.library.id ===
          libId) {
          loadMap(searchResult.result_id);
          found = true;
        }
      });
    },
    error: (req, status, e) => {
      console.log(status)
    },
  });

  if (bibId) {
    loadHoldings();
  }
});
