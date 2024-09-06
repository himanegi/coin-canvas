function sortAmount() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("tableContent");
  switching = true;

  while (switching) {
    switching = false;
    rows = table.rows;

    for (i = 1; i < rows.length - 1; i++) {
      shouldSwitch = false;
      x = parseInt(rows[i].getElementsByTagName("TD")[1].innerHTML, 10);
      y = parseInt(rows[i + 1].getElementsByTagName("TD")[1].innerHTML, 10);

      if (x > y) {
        shouldSwitch = true;
        break;
      }
    }

    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

function sortDate() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("tableContent");
  switching = true;

  while (switching) {
    switching = false;
    rows = table.rows;

    for (i = 1; i < rows.length - 1; i++) {
      shouldSwitch = false;

      x = rows[i].getElementsByTagName("TD")[4].innerHTML;
      y = rows[i + 1].getElementsByTagName("TD")[4].innerHTML;

      x = new Date(x);
      y = new Date(y);

      if (x < y) {
        shouldSwitch = true;
        break;
      }
    }

    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}
