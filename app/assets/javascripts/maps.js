let bibData;

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
