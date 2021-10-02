(() => {
  // media/editor/byteData.ts
  var ByteData = class {
    constructor(uint8num) {
      this.decimal = uint8num;
      this.adjacentBytes = [];
    }
    addAdjacentByte(byte_obj) {
      this.adjacentBytes.push(byte_obj);
    }
    toHex() {
      return this.decimal.toString(16).toUpperCase();
    }
    to8bitUInt() {
      return this.decimal;
    }
    toUTF8(littleEndian) {
      let uint8Data = [this.to8bitUInt()];
      for (let i = 0; i < 3 && i < this.adjacentBytes.length; i++) {
        uint8Data.push(this.adjacentBytes[i].to8bitUInt());
      }
      if (!littleEndian) {
        uint8Data = uint8Data.reverse();
      }
      const utf8 = new TextDecoder("utf-8").decode(new Uint8Array(uint8Data));
      for (const char of utf8)
        return char;
      return utf8;
    }
  };

  // media/editor/util.ts
  var isMac = navigator.userAgent.indexOf("Mac OS X") >= 0;
  var Range = class {
    constructor(start, end = Number.MAX_SAFE_INTEGER) {
      if (start > end) {
        this.start = end;
        this.end = start;
      } else {
        this.start = start;
        this.end = end;
      }
    }
    between(num) {
      if (this.end) {
        return num >= this.start && num <= this.end;
      } else {
        return num >= this.start;
      }
    }
  };
  function withinAnyRange(num, ranges) {
    for (const range of ranges) {
      if (range.between(num)) {
        return true;
      }
    }
    return false;
  }
  function generateCharacterRanges() {
    const ranges = [];
    ranges.push(new Range(0, 31));
    ranges.push(new Range(127, 160));
    ranges.push(new Range(173, 173));
    ranges.push(new Range(256));
    return ranges;
  }
  function getElementsWithGivenOffset(offset) {
    return document.getElementsByClassName(`cell-offset-${offset}`);
  }
  function getElementsOffset(element) {
    for (const currentClass of element.classList) {
      if (currentClass.indexOf("cell-offset") !== -1) {
        const offset = parseInt(currentClass.replace("cell-offset-", ""));
        return offset;
      }
    }
    return NaN;
  }
  function getElementsColumn(element) {
    if (element.classList.contains("hex"))
      return "hex";
    if (element.classList.contains("ascii"))
      return "ascii";
    return;
  }
  function getElementsGivenMouseEvent(event) {
    if (!event || !event.target)
      return [];
    const hovered = event.target;
    return getElementsWithGivenOffset(getElementsOffset(hovered));
  }
  function updateAsciiValue(byteData, asciiElement) {
    asciiElement.classList.remove("nongraphic");
    if (withinAnyRange(byteData.to8bitUInt(), generateCharacterRanges())) {
      asciiElement.classList.add("nongraphic");
      asciiElement.innerText = ".";
    } else {
      const ascii_char = String.fromCharCode(byteData.to8bitUInt());
      asciiElement.innerText = ascii_char;
    }
  }
  function pad(number, width) {
    number = number + "";
    return number.length >= width ? number : new Array(width - number.length + 1).join("0") + number;
  }
  function retrieveSelectedByteObject(elements) {
    var _a, _b, _c;
    for (const element of Array.from(elements)) {
      if (element.parentElement && element.classList.contains("hex")) {
        const byte_object = new ByteData(parseInt(element.innerHTML, 16));
        let current_element = element.nextElementSibling || ((_a = element.parentElement.nextElementSibling) == null ? void 0 : _a.children[0]);
        for (let i = 0; i < 7; i++) {
          if (!current_element || current_element.innerHTML === "+")
            break;
          byte_object.addAdjacentByte(new ByteData(parseInt(current_element.innerHTML, 16)));
          current_element = current_element.nextElementSibling || ((_c = (_b = current_element.parentElement) == null ? void 0 : _b.nextElementSibling) == null ? void 0 : _c.children[0]);
        }
        return byte_object;
      }
    }
    return;
  }
  function createOffsetRange(startOffset, endOffset) {
    const offsetsToSelect = [];
    if (endOffset < startOffset) {
      const temp = endOffset;
      endOffset = startOffset;
      startOffset = temp;
    }
    for (let i = startOffset; i <= endOffset; i++) {
      offsetsToSelect.push(i);
    }
    return offsetsToSelect;
  }
  function hexQueryToArray(query) {
    let currentCharacterSequence = "";
    const queryArray = [];
    for (let i = 0; i < query.length; i++) {
      if (query[i] === " ")
        continue;
      currentCharacterSequence += query[i];
      if (currentCharacterSequence.length === 2) {
        queryArray.push(currentCharacterSequence);
        currentCharacterSequence = "";
      }
    }
    if (currentCharacterSequence.length > 0) {
      queryArray.push("0" + currentCharacterSequence);
    }
    return queryArray;
  }
  function disjunction(one, other) {
    const result = [];
    let i = 0, j = 0;
    while (i < one.length || j < other.length) {
      if (i >= one.length) {
        result.push(other[j++]);
      } else if (j >= other.length) {
        result.push(one[i++]);
      } else if (one[i] === other[j]) {
        result.push(one[i]);
        i++;
        j++;
        continue;
      } else if (one[i] < other[j]) {
        result.push(one[i++]);
      } else {
        result.push(other[j++]);
      }
    }
    return result;
  }
  function relativeComplement(one, other) {
    const result = [];
    let i = 0, j = 0;
    while (i < one.length || j < other.length) {
      if (i >= one.length) {
        result.push(other[j++]);
      } else if (j >= other.length) {
        result.push(one[i++]);
      } else if (one[i] === other[j]) {
        i++;
        j++;
        continue;
      } else if (one[i] < other[j]) {
        result.push(one[i++]);
      } else {
        result.push(other[j++]);
      }
    }
    return result;
  }
  function binarySearch(array, key, comparator) {
    let low = 0, high = array.length - 1;
    while (low <= high) {
      const mid = (low + high) / 2 | 0;
      const comp = comparator(array[mid], key);
      if (comp < 0) {
        low = mid + 1;
      } else if (comp > 0) {
        high = mid - 1;
      } else {
        return mid;
      }
    }
    return -(low + 1);
  }

  // media/editor/eventHandlers.ts
  function toggleHover(event) {
    const elements = getElementsGivenMouseEvent(event);
    if (elements.length === 0)
      return;
    elements[0].classList.toggle("hover");
    elements[1].classList.toggle("hover");
  }

  // media/editor/webviewStateManager.ts
  var WebviewStateManager = class {
    static setProperty(propertyName, propertyValue) {
      let currentState = WebviewStateManager.getState();
      if (currentState === void 0) {
        currentState = {};
      }
      currentState[propertyName] = propertyValue;
      vscode.setState(currentState);
    }
    static clearState() {
      vscode.setState();
    }
    static getState() {
      return typeof vscode.getState() === "string" ? JSON.parse(vscode.getState()) : vscode.getState();
    }
    static setState(state) {
      vscode.setState(state);
    }
    static getProperty(propertyName) {
      const state = WebviewStateManager.getState();
      return state[propertyName];
    }
  };

  // media/editor/scrollBarHandler.ts
  var ScrollBarHandler = class {
    constructor(scrollBarId, numRows, rowHeight) {
      this.scrollTop = 0;
      this.isDragging = false;
      if (document.getElementById(scrollBarId)) {
        this.scrollBar = document.getElementById(scrollBarId);
        this.scrollThumb = this.scrollBar.children[0];
      } else {
        this.scrollBar = document.createElement("div");
        this.scrollThumb = document.createElement("div");
        throw "Invalid scrollbar id!";
      }
      window.addEventListener("wheel", this.onMouseWheel.bind(this));
      this.scrollBar.addEventListener("mousedown", () => {
        this.scrollThumb.classList.add("scrolling");
        this.isDragging = true;
      });
      this.scrollBar.addEventListener("mouseup", () => {
        this.scrollThumb.classList.remove("scrolling");
        this.isDragging = false;
      });
      window.addEventListener("mousemove", this.scrollThumbDrag.bind(this));
      this.rowHeight = rowHeight;
      this.updateScrollBar(numRows);
    }
    updateScrollBar(numRows) {
      const contentHeight = (numRows + 1) * this.rowHeight;
      this.scrollBarHeight = this.scrollBar.clientHeight;
      this.scrollThumbHeight = Math.min(this.scrollBarHeight, Math.max(this.scrollBarHeight * (this.scrollBarHeight / contentHeight), 30));
      this.scrollThumb.style.height = `${this.scrollThumbHeight}px`;
      this.scrollJump = Math.max(0, (contentHeight - this.scrollBarHeight) / (this.scrollBarHeight - this.scrollThumbHeight));
      this.updateScrolledPosition();
    }
    scrollThumbDrag(event) {
      if (this.scrollBarHeight === this.scrollThumbHeight)
        return;
      if (!this.isDragging || event.buttons == 0) {
        this.isDragging = false;
        this.scrollThumb.classList.remove("scrolling");
        return;
      }
      event.preventDefault();
      this.updateVirtualScrollTop(event.clientY * this.scrollJump);
      this.updateScrolledPosition();
    }
    async updateScrolledPosition() {
      if (!virtualHexDocument || !virtualHexDocument.documentHeight)
        return [];
      this.scrollThumb.style.transform = `translateY(${this.scrollTop / this.scrollJump}px)`;
      document.getElementsByClassName("rowwrapper")[0].style.transform = `translateY(-${this.scrollTop % virtualHexDocument.documentHeight}px)`;
      document.getElementsByClassName("rowwrapper")[1].style.transform = `translateY(-${this.scrollTop % virtualHexDocument.documentHeight}px)`;
      document.getElementsByClassName("rowwrapper")[2].style.transform = `translateY(-${this.scrollTop % virtualHexDocument.documentHeight}px)`;
      return virtualHexDocument.scrollHandler();
    }
    onMouseWheel(event) {
      if (this.scrollBarHeight === this.scrollThumbHeight)
        return;
      if (event.deltaY === 0 || event.shiftKey)
        return;
      if (isMac && Math.abs(event.deltaY) !== 120) {
        switch (event.deltaMode) {
          case WheelEvent.DOM_DELTA_LINE:
            if (event.deltaY > 0) {
              this.updateVirtualScrollTop(this.scrollTop + this.rowHeight);
            } else {
              this.updateVirtualScrollTop(this.scrollTop - this.rowHeight);
            }
            break;
          case WheelEvent.DOM_DELTA_PIXEL:
          default:
            this.updateVirtualScrollTop(this.scrollTop + event.deltaY);
        }
      } else {
        if (event.deltaY > 0) {
          this.updateVirtualScrollTop(this.scrollTop + this.rowHeight);
        } else {
          this.updateVirtualScrollTop(this.scrollTop - this.rowHeight);
        }
      }
      this.updateScrolledPosition();
    }
    async scrollDocument(numRows, direction) {
      if (direction === "up") {
        this.updateVirtualScrollTop(this.scrollTop - this.rowHeight * numRows);
      } else {
        this.updateVirtualScrollTop(this.scrollTop + this.rowHeight * numRows);
      }
      return this.updateScrolledPosition();
    }
    scrollToTop() {
      this.updateVirtualScrollTop(0);
      this.updateScrolledPosition();
    }
    scrollToBottom() {
      this.updateVirtualScrollTop((this.scrollBarHeight - this.scrollThumbHeight) * this.scrollJump + this.rowHeight);
      this.updateScrolledPosition();
    }
    page(viewportHeight, direction) {
      if (direction == "up") {
        this.updateVirtualScrollTop(this.scrollTop - viewportHeight);
      } else {
        this.updateVirtualScrollTop(this.scrollTop + viewportHeight);
      }
      this.updateScrolledPosition();
    }
    updateVirtualScrollTop(newScrollTop) {
      this.scrollTop = Math.max(0, newScrollTop);
      newScrollTop = this.scrollTop;
      this.scrollTop = Math.min(newScrollTop, (this.scrollBarHeight - this.scrollThumbHeight) * this.scrollJump + this.rowHeight);
      WebviewStateManager.setProperty("scroll_top", this.scrollTop);
    }
    get virtualScrollTop() {
      return this.scrollTop;
    }
    resyncScrollPosition() {
      if (WebviewStateManager.getState() && WebviewStateManager.getState().scroll_top) {
        this.updateVirtualScrollTop(WebviewStateManager.getState().scroll_top);
        this.updateScrolledPosition();
      }
    }
    async scrollToOffset(offset, force) {
      if (this.scrollBarHeight === this.scrollThumbHeight)
        return [];
      const topOffset = virtualHexDocument.topOffset();
      if (!force && offset >= topOffset && offset <= virtualHexDocument.bottomOffset())
        return [];
      const rowDifference = Math.floor(Math.abs(offset - topOffset) / 16);
      if (offset > topOffset) {
        return this.scrollDocument(rowDifference - 3, "down");
      } else {
        return this.scrollDocument(rowDifference + 3, "up");
      }
    }
  };

  // media/editor/selectHandler.ts
  var SelectHandler = class {
    constructor() {
      this._selection = [];
    }
    static toggleSelectOffset(offset, force) {
      const elements = getElementsWithGivenOffset(offset);
      if (elements.length === 0) {
        return;
      }
      elements[0].classList.toggle("selected", force);
      elements[1].classList.toggle("selected", force);
    }
    getFocused() {
      return this._focus;
    }
    setFocused(offset) {
      this._focus = offset;
    }
    getSelectionStart() {
      var _a;
      return (_a = this._selectionStart) != null ? _a : this._focus;
    }
    getSelected() {
      var _a;
      return (_a = WebviewStateManager.getProperty("selected_offsets")) != null ? _a : [];
    }
    setSelected(offsets, forceRender = false) {
      const oldSelection = this._selection;
      this._selection = [...offsets].sort((a, b) => a - b);
      this._selectionStart = this._selection[0];
      WebviewStateManager.setProperty("selected_offsets", this._selection);
      const toRender = forceRender ? disjunction(oldSelection, this._selection) : relativeComplement(oldSelection, this._selection);
      this.renderSelection(toRender);
    }
    getAnchor() {
      return WebviewStateManager.getProperty("selection_anchor");
    }
    setAnchor(offset) {
      WebviewStateManager.setProperty("selection_anchor", offset);
    }
    renderSelection(offsets) {
      const contains = (offset) => binarySearch(this._selection, offset, (a, b) => a - b) >= 0;
      for (const offset of offsets) {
        SelectHandler.toggleSelectOffset(offset, contains(offset));
      }
    }
    static getSelectedHex() {
      const hex = [];
      const selected = document.getElementsByClassName("selected hex");
      for (let i = 0; i < selected.length; i++) {
        if (selected[i].innerText === "+")
          continue;
        hex.push(selected[i].innerText);
      }
      return hex;
    }
    static focusSelection(section) {
      const selection = document.getElementsByClassName(`selected ${section}`);
      if (selection.length !== 0)
        selection[0].focus();
    }
    static getSelectedValue() {
      var _a;
      let selectedValue = "";
      let section = "hex";
      let selectedElements;
      if ((_a = document.activeElement) == null ? void 0 : _a.classList.contains("ascii")) {
        section = "ascii";
        selectedElements = document.getElementsByClassName("selected ascii");
      } else {
        selectedElements = document.getElementsByClassName("selected hex");
      }
      for (const element of selectedElements) {
        if (element.innerText === "+")
          continue;
        selectedValue += element.innerText;
        if (section === "hex")
          selectedValue += " ";
      }
      if (section === "hex")
        selectedValue = selectedValue.trimRight();
      return selectedValue;
    }
  };

  // media/editor/editHandler.ts
  var EditHandler = class {
    constructor() {
      this.pendingEdit = void 0;
    }
    async editHex(element, keyPressed) {
      if (keyPressed === "Escape" && this.pendingEdit && this.pendingEdit.previousValue) {
        element.innerText = this.pendingEdit.previousValue;
        element.classList.remove("editing");
        this.pendingEdit = void 0;
      }
      const regex = new RegExp(/^[a-fA-F0-9]$/gm);
      if (keyPressed.match(regex) === null && keyPressed !== "Delete") {
        return;
      }
      const offset = getElementsOffset(element);
      if (!this.pendingEdit || this.pendingEdit.offset != offset) {
        this.pendingEdit = {
          offset,
          previousValue: element.innerText === "+" ? void 0 : element.innerText,
          newValue: "",
          element
        };
      }
      element.classList.add("editing");
      element.innerText = element.innerText.trimRight();
      if (keyPressed === "Delete") {
        element.innerText = "  ";
      } else {
        element.innerText = element.innerText.length !== 1 || element.innerText === "+" ? `${keyPressed.toUpperCase()} ` : element.innerText + keyPressed.toUpperCase();
      }
      this.pendingEdit.newValue = element.innerText;
      if (element.innerText.trimRight().length == 2) {
        element.classList.remove("add-cell");
        if (this.pendingEdit.newValue == this.pendingEdit.previousValue) {
          this.pendingEdit = void 0;
          return;
        }
        await this.sendEditToExtHost([this.pendingEdit]);
        this.updateAscii(element.innerText, offset);
        element.classList.add("edited");
        if (!this.pendingEdit.previousValue) {
          virtualHexDocument.createAddCell();
        }
        this.pendingEdit = void 0;
      }
    }
    async editAscii(element, keyPressed) {
      if (keyPressed.length != 1)
        return;
      const offset = getElementsOffset(element);
      const hexElement = getElementsWithGivenOffset(offset)[0];
      const newValueHex = keyPressed.charCodeAt(0).toString(16).toUpperCase();
      if (hexElement.innerText === newValueHex) {
        return;
      }
      this.pendingEdit = {
        offset,
        previousValue: hexElement.innerText === "+" ? void 0 : hexElement.innerText,
        newValue: newValueHex,
        element
      };
      element.classList.remove("add-cell");
      element.classList.add("editing");
      element.classList.add("edited");
      this.updateAscii(this.pendingEdit.newValue, offset);
      this.updateHex(keyPressed, offset);
      await this.sendEditToExtHost([this.pendingEdit]);
      if (!this.pendingEdit.previousValue) {
        virtualHexDocument.createAddCell();
      }
      this.pendingEdit = void 0;
    }
    updateAscii(hexValue, offset) {
      if (!hexValue)
        return;
      const ascii = getElementsWithGivenOffset(offset)[1];
      ascii.classList.remove("add-cell");
      updateAsciiValue(new ByteData(parseInt(hexValue, 16)), ascii);
      ascii.classList.add("edited");
    }
    updateHex(asciiValue, offset) {
      const hex = getElementsWithGivenOffset(offset)[0];
      hex.innerText = asciiValue.charCodeAt(0).toString(16).toUpperCase();
      hex.classList.remove("add-cell");
      hex.classList.add("edited");
    }
    async completePendingEdits() {
      if (this.pendingEdit && this.pendingEdit.element && this.pendingEdit.newValue) {
        if (this.pendingEdit.element.classList.contains("selected"))
          return;
        this.pendingEdit.newValue = "00" + this.pendingEdit.newValue.trimRight();
        this.pendingEdit.newValue = this.pendingEdit.newValue.slice(this.pendingEdit.newValue.length - 2);
        this.pendingEdit.element.classList.remove("editing");
        this.pendingEdit.element.innerText = this.pendingEdit.newValue;
        if (this.pendingEdit.newValue === this.pendingEdit.previousValue) {
          return;
        }
        this.updateAscii(this.pendingEdit.newValue, this.pendingEdit.offset);
        this.pendingEdit.element.classList.add("edited");
        this.pendingEdit.element.classList.remove("add-cell");
        await this.sendEditToExtHost([this.pendingEdit]);
        if (!this.pendingEdit.previousValue) {
          virtualHexDocument.createAddCell();
        }
        this.pendingEdit = void 0;
      }
    }
    async sendEditToExtHost(edits) {
      const extHostMessage = [];
      for (const edit of edits) {
        const oldValue = edit.previousValue ? parseInt(edit.previousValue, 16) : void 0;
        const newValue = edit.newValue ? parseInt(edit.newValue, 16) : void 0;
        const currentMessage = {
          offset: edit.offset,
          oldValue,
          newValue,
          sameOnDisk: false
        };
        extHostMessage.push(currentMessage);
      }
      try {
        const syncedFileSize = (await messageHandler.postMessageWithResponse("edit", extHostMessage)).fileSize;
        virtualHexDocument.updateDocumentSize(syncedFileSize);
      } catch (e) {
        return;
      }
    }
    undo(edits) {
      if (edits.length > 1 && edits[0].offset < edits[edits.length - 1].offset) {
        edits = edits.reverse();
      }
      for (const edit of edits) {
        if (edit.oldValue === void 0) {
          virtualHexDocument.focusElementWithGivenOffset(virtualHexDocument.documentSize);
          virtualHexDocument.removeLastCell();
          continue;
        }
        const elements = getElementsWithGivenOffset(edit.offset);
        if (elements.length != 2)
          return;
        if (edit.sameOnDisk) {
          elements[0].classList.remove("edited");
          elements[1].classList.remove("edited");
        } else {
          elements[0].classList.add("edited");
          elements[1].classList.add("edited");
        }
        elements[0].innerText = edit.oldValue.toString(16).toUpperCase();
        elements[0].innerText = elements[0].innerText.length == 2 ? elements[0].innerText : `0${elements[0].innerText}`;
        updateAsciiValue(new ByteData(edit.oldValue), elements[1]);
        virtualHexDocument.focusElementWithGivenOffset(edit.offset);
      }
    }
    redo(edits) {
      for (const edit of edits) {
        if (edit.newValue === void 0)
          continue;
        const elements = getElementsWithGivenOffset(edit.offset);
        if (elements.length != 2)
          continue;
        elements[0].classList.remove("add-cell");
        elements[1].classList.remove("add-cell");
        if (edit.sameOnDisk) {
          elements[0].classList.remove("edited");
          elements[1].classList.remove("edited");
        } else {
          elements[0].classList.add("edited");
          elements[1].classList.add("edited");
        }
        elements[0].innerText = edit.newValue.toString(16).toUpperCase();
        elements[0].innerText = elements[0].innerText.length == 2 ? elements[0].innerText : `0${elements[0].innerText}`;
        updateAsciiValue(new ByteData(edit.newValue), elements[1]);
        if (document.getElementsByClassName("add-cell").length === 0 && edit.oldValue === void 0) {
          virtualHexDocument.updateDocumentSize(virtualHexDocument.documentSize + 1);
          virtualHexDocument.createAddCell();
        }
        virtualHexDocument.focusElementWithGivenOffset(edit.offset);
      }
    }
    copy(event) {
      var _a, _b;
      (_a = event.clipboardData) == null ? void 0 : _a.setData("text/json", JSON.stringify(SelectHandler.getSelectedHex()));
      (_b = event.clipboardData) == null ? void 0 : _b.setData("text/plain", SelectHandler.getSelectedValue());
      event.preventDefault();
    }
    async paste(event) {
      if (!event.clipboardData || event.clipboardData.types.indexOf("text/json") < 0)
        return;
      const hexData = JSON.parse(event.clipboardData.getData("text/json"));
      const selected = Array.from(document.getElementsByClassName("selected hex"));
      const edits = [];
      for (let i = 0; i < selected.length && i < hexData.length; i++) {
        const element = selected[i];
        const offset = getElementsOffset(element);
        const currentEdit = {
          offset,
          previousValue: element.innerText === "+" ? void 0 : element.innerText,
          newValue: hexData[i],
          element
        };
        element.classList.remove("add-cell");
        if (currentEdit.newValue == currentEdit.previousValue) {
          continue;
        }
        element.innerText = hexData[i];
        this.updateAscii(element.innerText, offset);
        element.classList.add("edited");
        if (currentEdit.previousValue === void 0) {
          virtualHexDocument.updateDocumentSize(virtualHexDocument.documentSize + 1);
          virtualHexDocument.createAddCell();
          selected.push(getElementsWithGivenOffset(virtualHexDocument.documentSize)[0]);
        }
        edits.push(currentEdit);
      }
      await this.sendEditToExtHost(edits);
      event.preventDefault();
    }
    revert() {
      virtualHexDocument.reRequestChunks();
    }
  };

  // media/editor/searchHandler.ts
  var SearchHandler = class {
    constructor() {
      this.searchType = "hex";
      this.resultIndex = 0;
      this.preserveCase = false;
      var _a;
      this.searchContainer = document.getElementById("search-container");
      this.searchContainer.innerHTML = SearchHandler.getSearchWidgetHTML();
      this.searchResults = [];
      this.searchOptions = {
        regex: false,
        caseSensitive: false
      };
      this.findTextBox = document.getElementById("find");
      this.replaceTextBox = document.getElementById("replace");
      this.replaceButton = document.getElementById("replace-btn");
      this.replaceAllButton = document.getElementById("replace-all");
      this.findPreviousButton = document.getElementById("find-previous");
      this.findNextButton = document.getElementById("find-next");
      this.stopSearchButton = document.getElementById("search-stop");
      const closeButton = document.getElementById("close");
      this.findNextButton.addEventListener("click", () => this.findNext(true));
      this.findPreviousButton.addEventListener("click", () => this.findPrevious(true));
      this.updateInputGlyphs();
      (_a = document.getElementById("data-type")) == null ? void 0 : _a.addEventListener("change", (event) => {
        const selectedValue = event.target.value;
        this.searchType = selectedValue;
        this.updateInputGlyphs();
        this.search();
      });
      this.searchOptionsHandler();
      this.replaceOptionsHandler();
      this.findTextBox.addEventListener("keyup", (event) => {
        if ((event.key === "Enter" || event.key === "F3") && event.shiftKey) {
          this.findPrevious(false);
        } else if (event.key === "Enter" || event.key === "F3") {
          this.findNext(false);
        } else if (event.key === "Escape") {
          this.hideWidget();
          const selected = document.getElementsByClassName(`selected ${this.searchType}`)[0];
          if (selected !== void 0) {
            selected.focus();
          } else {
            virtualHexDocument.focusElementWithGivenOffset(virtualHexDocument.topOffset());
          }
        } else if (event.ctrlKey || new RegExp("(^Arrow|^End|^Home)", "i").test(event.key)) {
          return;
        } else {
          this.search();
        }
      });
      window.addEventListener("keyup", (event) => {
        if (event.key === "F3" && event.shiftKey && document.activeElement !== this.findTextBox) {
          this.findPrevious(true);
          event.preventDefault();
        } else if (event.key === "F3" && document.activeElement !== this.findTextBox) {
          this.findNext(true);
          event.preventDefault();
        }
      });
      this.replaceTextBox.addEventListener("keyup", this.updateReplaceButtons.bind(this));
      this.replaceButton.addEventListener("click", () => this.replace(false));
      this.replaceAllButton.addEventListener("click", () => this.replace(true));
      this.stopSearchButton.addEventListener("click", this.cancelSearch.bind(this));
      closeButton.addEventListener("click", () => this.hideWidget());
      document.getElementById("find-message-box").hidden = true;
      document.getElementById("replace-message-box").hidden = true;
    }
    static getSearchWidgetHTML() {
      return `
        <div class="header">
            SEARCH IN
            <span>
                <select id="data-type" class="inline-select">
                    <option value="hex">Hex</option>
                    <option value="ascii">Text</option>
                </select>
            </span>
        </div>
        <div class="search-widget">
            <div class="bar find-bar">
                <span class="input-glyph-group">
                    <input type="text" autocomplete="off" spellcheck="off" name="find" id="find" placeholder="Find"/>
                    <span class="bar-glyphs">
                        <span class="codicon codicon-case-sensitive" id="case-sensitive" title="Match Case"></span>
                        <span class="codicon codicon-regex" id="regex-icon" title="Use Regular Expression"></span>
                    </span>
                    <div id="find-message-box">
                    </div>
                </span>
                <span class="icon-group">
                    <span class="codicon codicon-search-stop disabled" id="search-stop" title="Cancel Search"></span>
                    <span class="codicon codicon-arrow-up disabled" id="find-previous" title="Previous Match"></span>
                    <span class="codicon codicon-arrow-down disabled" id="find-next" title="Next Match"></span>
										<span class ="codicon codicon-close" id="close" title="Close (Escape)"></span>
                </span>
            </div>
            <div class="bar replace-bar">
                <span class="input-glyph-group">
                    <input type="text" autocomplete="off" spellcheck="off" name="replace" id="replace" placeholder="Replace"/>
                    <span class="bar-glyphs">
                        <span class="codicon codicon-preserve-case" id="preserve-case" title="Preserve Case"></span>
                    </span>
                    <div id="replace-message-box">
                        </div>
                </span>
                <span class="icon-group">
                    <span class="codicon codicon-replace disabled" id="replace-btn" title="Replace"></span>
                    <span class="codicon codicon-replace-all disabled" id="replace-all" title="Replace All"></span>
                </span>
            </div>
        </div>`;
    }
    async search() {
      if (this.findTextBox.value === "") {
        this.removeInputMessage("find");
        return;
      }
      this.cancelSearch();
      virtualHexDocument.setSelection([]);
      this.searchResults = [];
      this.updateReplaceButtons();
      this.findNextButton.classList.add("disabled");
      this.findPreviousButton.classList.add("disabled");
      let query = this.findTextBox.value;
      const hexSearchRegex = new RegExp("^[a-fA-F0-9? ]+$");
      if (this.searchType === "hex" && !hexSearchRegex.test(query)) {
        if (query.length > 0)
          this.addInputMessage("find", "Invalid query", "error");
        return;
      }
      if (this.searchOptions.regex) {
        try {
          new RegExp(query);
        } catch (err) {
          const message = err.message.substr(0, 27) + "\n" + err.message.substr(27);
          this.addInputMessage("find", message, "error");
          return;
        }
      }
      query = this.searchType === "hex" ? hexQueryToArray(query) : query;
      if (query.length === 0) {
        if (this.findTextBox.value.length > 0)
          this.addInputMessage("find", "Invalid query", "error");
        return;
      }
      this.stopSearchButton.classList.remove("disabled");
      let results;
      this.removeInputMessage("find");
      try {
        results = (await messageHandler.postMessageWithResponse("search", {
          query,
          type: this.searchType,
          options: this.searchOptions
        })).results;
      } catch (err) {
        this.stopSearchButton.classList.add("disabled");
        this.addInputMessage("find", "Search returned an error!", "error");
        return;
      }
      if (results.partial) {
        this.addInputMessage("find", "Partial results returned, try\n narrowing your query.", "warning");
      }
      this.stopSearchButton.classList.add("disabled");
      this.resultIndex = 0;
      this.searchResults = results.result;
      if (this.searchResults.length !== 0) {
        await virtualHexDocument.scrollDocumentToOffset(this.searchResults[this.resultIndex][0]);
        virtualHexDocument.setSelection(this.searchResults[this.resultIndex]);
        if (this.resultIndex + 1 < this.searchResults.length) {
          this.findNextButton.classList.remove("disabled");
        }
        this.updateReplaceButtons();
      }
    }
    async findNext(focus) {
      if (this.findNextButton.classList.contains("disabled"))
        return;
      await virtualHexDocument.scrollDocumentToOffset(this.searchResults[++this.resultIndex][0]);
      virtualHexDocument.setSelection(this.searchResults[this.resultIndex]);
      if (focus)
        SelectHandler.focusSelection(this.searchType);
      if (this.resultIndex < this.searchResults.length - 1) {
        this.findNextButton.classList.remove("disabled");
      } else {
        this.findNextButton.classList.add("disabled");
      }
      if (this.resultIndex != 0) {
        this.findPreviousButton.classList.remove("disabled");
      }
    }
    async findPrevious(focus) {
      if (this.findPreviousButton.classList.contains("disabled"))
        return;
      await virtualHexDocument.scrollDocumentToOffset(this.searchResults[--this.resultIndex][0]);
      virtualHexDocument.setSelection(this.searchResults[this.resultIndex]);
      if (focus)
        SelectHandler.focusSelection(this.searchType);
      this.findNextButton.classList.remove("disabled");
      if (this.resultIndex == 0) {
        this.findPreviousButton.classList.add("disabled");
      }
    }
    updateInputGlyphs() {
      const inputGlyphs = document.getElementsByClassName("bar-glyphs");
      const inputFields = document.querySelectorAll(".bar > .input-glyph-group > input");
      if (this.searchType == "hex") {
        inputGlyphs[0].hidden = true;
        inputGlyphs[1].hidden = true;
        document.documentElement.style.setProperty("--input-glyph-padding", "0px");
      } else {
        for (let i = 0; i < inputGlyphs.length; i++) {
          inputGlyphs[i].hidden = false;
        }
        const glyphRect = inputGlyphs[0].getBoundingClientRect();
        const inputRect = inputFields[0].getBoundingClientRect();
        const inputPadding = inputRect.x + inputRect.width + 1 - glyphRect.x;
        document.documentElement.style.setProperty("--input-glyph-padding", `${inputPadding}px`);
      }
    }
    searchOptionsHandler() {
      var _a, _b;
      (_a = document.getElementById("regex-icon")) == null ? void 0 : _a.addEventListener("click", (event) => {
        const regexIcon = event.target;
        if (regexIcon.classList.contains("toggled")) {
          this.searchOptions.regex = false;
          regexIcon.classList.remove("toggled");
        } else {
          this.searchOptions.regex = true;
          regexIcon.classList.add("toggled");
        }
        this.search();
      });
      (_b = document.getElementById("case-sensitive")) == null ? void 0 : _b.addEventListener("click", (event) => {
        const caseSensitive = event.target;
        if (caseSensitive.classList.contains("toggled")) {
          this.searchOptions.caseSensitive = false;
          caseSensitive.classList.remove("toggled");
        } else {
          this.searchOptions.caseSensitive = true;
          caseSensitive.classList.add("toggled");
        }
        this.search();
      });
    }
    replaceOptionsHandler() {
      var _a;
      (_a = document.getElementById("preserve-case")) == null ? void 0 : _a.addEventListener("click", (event) => {
        const preserveCase = event.target;
        if (preserveCase.classList.contains("toggled")) {
          this.preserveCase = false;
          preserveCase.classList.remove("toggled");
        } else {
          this.preserveCase = true;
          preserveCase.classList.add("toggled");
        }
      });
    }
    cancelSearch() {
      if (this.stopSearchButton.classList.contains("disabled"))
        return;
      this.stopSearchButton.classList.add("disabled");
      messageHandler.postMessageWithResponse("search", { cancel: true });
    }
    updateReplaceButtons() {
      this.removeInputMessage("replace");
      const hexReplaceRegex = new RegExp("^[a-fA-F0-9]+$");
      const queryNoSpaces = this.replaceTextBox.value.replace(/\s/g, "");
      if (this.searchType === "hex" && !hexReplaceRegex.test(queryNoSpaces)) {
        this.replaceAllButton.classList.add("disabled");
        this.replaceButton.classList.add("disabled");
        if (this.replaceTextBox.value.length > 0)
          this.addInputMessage("replace", "Invalid replacement", "error");
        return;
      }
      const replaceQuery = this.replaceTextBox.value;
      const replaceArray = this.searchType === "hex" ? hexQueryToArray(replaceQuery) : Array.from(replaceQuery);
      if (this.searchResults.length !== 0 && replaceArray.length !== 0) {
        this.replaceAllButton.classList.remove("disabled");
        this.replaceButton.classList.remove("disabled");
      } else {
        if (this.replaceTextBox.value.length > 0 && replaceArray.length === 0)
          this.addInputMessage("replace", "Invalid replacement", "error");
        this.replaceAllButton.classList.add("disabled");
        this.replaceButton.classList.add("disabled");
      }
    }
    async replace(all) {
      const replaceQuery = this.replaceTextBox.value;
      const replaceArray = this.searchType === "hex" ? hexQueryToArray(replaceQuery) : Array.from(replaceQuery);
      let replaceBits = [];
      if (this.searchType === "hex") {
        replaceBits = replaceArray.map((val) => parseInt(val, 16));
      } else {
        replaceBits = replaceArray.map((val) => val.charCodeAt(0));
      }
      let offsets = [];
      if (all) {
        offsets = this.searchResults;
      } else {
        offsets = [this.searchResults[this.resultIndex]];
      }
      const edits = (await messageHandler.postMessageWithResponse("replace", {
        query: replaceBits,
        offsets,
        preserveCase: this.preserveCase
      })).edits;
      virtualHexDocument.redo(edits, virtualHexDocument.documentSize);
      this.findNext(true);
    }
    searchKeybindingHandler() {
      var _a;
      this.showWidget();
      this.searchType = ((_a = document.activeElement) == null ? void 0 : _a.classList.contains("ascii")) ? "ascii" : "hex";
      const dataTypeSelect = document.getElementById("data-type");
      dataTypeSelect.value = this.searchType;
      dataTypeSelect.dispatchEvent(new Event("change"));
      this.findTextBox.focus();
    }
    addInputMessage(inputBoxName, message, type) {
      const inputBox = inputBoxName === "find" ? this.findTextBox : this.replaceTextBox;
      const messageBox = document.getElementById(`${inputBoxName}-message-box`);
      if (messageBox.innerText === message && messageBox.classList.contains(`input-${type}`)) {
        return;
      } else if (messageBox.classList.contains(`input-${type}`)) {
        messageBox.innerText = message;
        return;
      } else {
        this.removeInputMessage("find", true);
        messageBox.innerText = message;
        inputBox.classList.add(`${type}-border`);
        messageBox.classList.add(`${type}-border`, `input-${type}`);
        messageBox.hidden = false;
      }
    }
    removeInputMessage(inputBoxName, skipHiding) {
      const inputBox = inputBoxName === "find" ? this.findTextBox : this.replaceTextBox;
      const errorMessageBox = document.getElementById(`${inputBoxName}-message-box`);
      inputBox.classList.remove("error-border", "warning-border");
      errorMessageBox.classList.remove("error-border", "warning-border", "input-warning", "input-error");
      if (skipHiding !== true)
        errorMessageBox.hidden = true;
    }
    showWidget() {
      if (this.searchContainer.style.display === "block")
        return;
      this.searchContainer.style.display = "block";
      let currentTop = -85;
      const frameInterval = setInterval(() => {
        if (currentTop === -4) {
          clearInterval(frameInterval);
        } else {
          currentTop++;
          this.searchContainer.style.top = `${currentTop}px`;
        }
      }, 3);
    }
    hideWidget() {
      let currentTop = -4;
      const frameInterval = setInterval(() => {
        if (currentTop === -85) {
          this.searchContainer.style.display = "none";
          clearInterval(frameInterval);
        } else {
          currentTop--;
          this.searchContainer.style.top = `${currentTop}px`;
        }
      }, 3);
    }
  };

  // media/editor/dataInspectorHandler.ts
  var DataInspectorHandler = class {
    static clearInspector() {
      messageHandler.postMessage("dataInspector", {
        method: "clear"
      });
    }
    static updateInspector(byte_obj) {
      messageHandler.postMessage("dataInspector", {
        method: "update",
        byteData: byte_obj
      });
    }
  };

  // media/editor/virtualDocument.ts
  var VirtualDocument = class {
    constructor(fileSize, editorFontSize, baseAddress = 0) {
      this.fileSize = fileSize;
      this.baseAddress = baseAddress;
      this.editHandler = new EditHandler();
      this.selectHandler = new SelectHandler();
      this.searchHandler = new SearchHandler();
      this.editorContainer = document.getElementById("editor-container");
      this.rowHeight = editorFontSize * 2;
      document.getElementsByClassName("header")[2].style.width = "16rem";
      this.documentHeight = 5e5;
      this.rows = [];
      for (let i = 0; i < 3; i++) {
        this.rows.push(new Map());
      }
      const headerHeight = document.getElementsByClassName("header")[0].offsetHeight;
      document.getElementsByClassName("header")[0].style.visibility = "hidden";
      document.getElementsByClassName("header")[0].style.height = `${headerHeight + 1}px`;
      this.scrollBarHandler = new ScrollBarHandler("scrollbar", this.fileSize / 16, this.rowHeight);
      this.documentResize();
      this.bindEventListeners();
    }
    render(newPackets) {
      var _a, _b, _c;
      let rowData = [];
      const addrFragment = document.createDocumentFragment();
      const hexFragment = document.createDocumentFragment();
      const asciiFragment = document.createDocumentFragment();
      for (let i = 0; i < newPackets.length; i++) {
        rowData.push(newPackets[i]);
        if (i === newPackets.length - 1 || rowData.length == 16) {
          if (!this.rows[0].get(rowData[0].offset.toString())) {
            this.populateHexAdresses(addrFragment, rowData);
            this.populateHexBody(hexFragment, rowData);
            this.populateAsciiTable(asciiFragment, rowData);
          }
          rowData = [];
        }
      }
      (_a = document.getElementById("hexaddr")) == null ? void 0 : _a.appendChild(addrFragment);
      (_b = document.getElementById("hexbody")) == null ? void 0 : _b.appendChild(hexFragment);
      (_c = document.getElementById("ascii")) == null ? void 0 : _c.appendChild(asciiFragment);
      if (WebviewStateManager.getState()) {
        const selectedOffsets = this.selectHandler.getSelected();
        if (selectedOffsets.length > 0) {
          this.selectHandler.setSelected(selectedOffsets, true);
        }
        const savedScrollTop = WebviewStateManager.getState().scroll_top;
        if (savedScrollTop && savedScrollTop !== this.scrollBarHandler.virtualScrollTop) {
          this.scrollBarHandler.resyncScrollPosition();
        }
      }
    }
    bindEventListeners() {
      this.editorContainer.addEventListener("keydown", this.editorKeyBoardHandler.bind(this));
      this.editorContainer.addEventListener("mouseover", toggleHover);
      this.editorContainer.addEventListener("mouseleave", toggleHover);
      this.editorContainer.addEventListener("click", this.clickHandler.bind(this));
      this.editorContainer.addEventListener("mousedown", this.mouseDownHandler.bind(this));
      window.addEventListener("copy", (event) => {
        var _a, _b;
        if (((_a = document.activeElement) == null ? void 0 : _a.classList.contains("hex")) || ((_b = document.activeElement) == null ? void 0 : _b.classList.contains("ascii"))) {
          this.editHandler.copy(event);
        }
      });
      window.addEventListener("paste", (event) => {
        var _a, _b;
        if (((_a = document.activeElement) == null ? void 0 : _a.classList.contains("hex")) || ((_b = document.activeElement) == null ? void 0 : _b.classList.contains("ascii"))) {
          this.editHandler.paste(event);
        }
      });
      window.addEventListener("resize", this.documentResize.bind(this));
      window.addEventListener("keydown", this.windowKeyboardHandler.bind(this));
    }
    documentResize() {
      this.viewPortHeight = document.documentElement.clientHeight;
      if (this.scrollBarHandler) {
        this.scrollBarHandler.updateScrollBar(this.fileSize / 16);
      }
    }
    topOffset() {
      return Math.floor(this.scrollBarHandler.virtualScrollTop / this.rowHeight) * 16;
    }
    bottomOffset() {
      const clientHeight = document.getElementsByTagName("html")[0].clientHeight;
      const numRowsInViewport = Math.floor(clientHeight / this.rowHeight);
      return Math.min(this.topOffset() + numRowsInViewport * 16 - 1, this.fileSize - 1);
    }
    offsetYPos(offset) {
      return Math.floor(offset / 16) * this.rowHeight % this.documentHeight;
    }
    async scrollHandler() {
      var _a, _b, _c;
      const chunkHandlerResponse = await chunkHandler.ensureBuffer(virtualHexDocument.topOffset(), {
        topBufferSize: 2,
        bottomBufferSize: 4
      });
      const removedChunks = chunkHandlerResponse.removed;
      for (const chunk of removedChunks) {
        for (let i = chunk; i < chunk + chunkHandler.chunkSize; i += 16) {
          (_a = this.rows[0].get(i.toString())) == null ? void 0 : _a.remove();
          this.rows[0].delete(i.toString());
          (_b = this.rows[1].get(i.toString())) == null ? void 0 : _b.remove();
          this.rows[1].delete(i.toString());
          (_c = this.rows[2].get(i.toString())) == null ? void 0 : _c.remove();
          this.rows[2].delete(i.toString());
        }
      }
      return chunkHandlerResponse.requested;
    }
    populateHexAdresses(fragment, rowData) {
      const offset = rowData[0].offset;
      const addr = document.createElement("div");
      const displayOffset = offset + this.baseAddress;
      addr.className = "row";
      addr.setAttribute("data-offset", offset.toString());
      addr.innerText = pad(displayOffset.toString(16), 8).toUpperCase();
      fragment.appendChild(addr);
      this.rows[0].set(offset.toString(), addr);
      this.translateRow(addr, offset);
    }
    populateAsciiTable(fragment, rowData) {
      const row = document.createElement("div");
      row.className = "row";
      const rowOffset = rowData[0].offset.toString();
      for (let i = 0; i < rowData.length; i++) {
        const ascii_element = this.createAsciiElement(rowData[i]);
        row.appendChild(ascii_element);
      }
      fragment.appendChild(row);
      this.rows[2].set(rowOffset, row);
      this.translateRow(row, parseInt(rowOffset));
    }
    populateHexBody(fragment, rowData) {
      const row = document.createElement("div");
      row.className = "row";
      const rowOffset = rowData[0].offset.toString();
      for (let i = 0; i < rowData.length; i++) {
        const hex_element = this.createHexElement(rowData[i]);
        row.appendChild(hex_element);
      }
      fragment.appendChild(row);
      this.rows[1].set(rowOffset, row);
      this.translateRow(row, parseInt(rowOffset));
    }
    createHexElement(packet) {
      const hex_element = document.createElement("span");
      hex_element.classList.add("hex");
      hex_element.classList.add(`cell-offset-${packet.offset.toString()}`);
      if (packet.offset < this.fileSize) {
        hex_element.innerText = pad(packet.data.toHex(), 2);
      } else {
        hex_element.classList.add("add-cell");
        hex_element.innerText = "+";
      }
      hex_element.tabIndex = -1;
      hex_element.addEventListener("mouseleave", toggleHover);
      return hex_element;
    }
    createAsciiElement(packet) {
      const ascii_element = document.createElement("span");
      ascii_element.classList.add(`cell-offset-${packet.offset.toString()}`);
      ascii_element.classList.add("ascii");
      if (packet.offset < this.fileSize) {
        updateAsciiValue(packet.data, ascii_element);
      } else {
        ascii_element.classList.add("add-cell");
        ascii_element.innerText = "+";
      }
      ascii_element.addEventListener("mouseleave", toggleHover);
      ascii_element.tabIndex = -1;
      return ascii_element;
    }
    translateRow(row, offset) {
      const expectedY = this.offsetYPos(offset);
      row.style.top = `${expectedY}px`;
    }
    clickHandler(event) {
      if (event.buttons > 1)
        return;
      const target = event.target;
      if (!target || isNaN(getElementsOffset(target))) {
        return;
      }
      event.preventDefault();
      this.editHandler.completePendingEdits();
      const offset = getElementsOffset(target);
      if (event.shiftKey) {
        const startSelection = this.selectHandler.getSelectionStart();
        if (startSelection !== void 0) {
          this.selectHandler.setFocused(offset);
          let selectionAnchor = this.selectHandler.getAnchor();
          if (selectionAnchor === void 0) {
            selectionAnchor = offset;
          }
          const min = Math.min(selectionAnchor, offset);
          const max = Math.max(offset, selectionAnchor);
          this.selectHandler.setSelected(createOffsetRange(min, max));
          target.focus({ preventScroll: true });
        }
      } else {
        this.selectHandler.setAnchor(offset);
        this.selectHandler.setFocused(offset);
        if (event.ctrlKey) {
          const selection = this.selectHandler.getSelected();
          const newSelection = selection.filter((i) => i !== offset);
          if (selection.length === newSelection.length) {
            this.selectHandler.setSelected([...newSelection, offset]);
          } else {
            this.selectHandler.setSelected(newSelection);
          }
        } else {
          this.selectHandler.setSelected([offset]);
        }
        this.updateInspector();
        target.focus({ preventScroll: true });
      }
    }
    mouseDownHandler(event) {
      if (event.buttons !== 1) {
        return;
      }
      const target = event.target;
      if (!target || isNaN(getElementsOffset(target))) {
        return;
      }
      event.preventDefault();
      this.editHandler.completePendingEdits();
      const offset = getElementsOffset(target);
      const startMouseMoveOffset = offset;
      const startSelection = event.shiftKey ? this.selectHandler.getSelectionStart() : offset;
      const onMouseMove = (event2) => {
        if (event2.buttons !== 1) {
          return;
        }
        const target2 = event2.target;
        if (!target2 || isNaN(getElementsOffset(target2))) {
          return;
        }
        const offset2 = getElementsOffset(target2);
        if (startSelection !== void 0 && offset2 !== startMouseMoveOffset) {
          this.selectHandler.setFocused(offset2);
          const min = Math.min(startSelection, offset2);
          const max = Math.max(startSelection, offset2);
          this.selectHandler.setSelected(createOffsetRange(min, max));
          target2.focus({ preventScroll: true });
        }
      };
      const onMouseUp = () => {
        this.editorContainer.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        this.updateInspector();
      };
      this.editorContainer.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    async editorKeyBoardHandler(event) {
      if (!event || !event.target)
        return;
      const targetElement = event.target;
      const modifierKeyPressed = event.metaKey || event.altKey || event.ctrlKey;
      if (event.key === "Tab") {
        const currentOffset = getElementsOffset(targetElement);
        const columnToFocus = getElementsColumn(targetElement) === "hex" ? "ascii" : "hex";
        this.focusElementWithGivenOffset(currentOffset, columnToFocus);
        event.preventDefault();
      } else if (new RegExp(/ArrowLeft|ArrowRight|ArrowUp|ArrowDown/gm).test(event.key) || (event.key === "End" || event.key === "Home") && !event.ctrlKey) {
        this.navigateByKey(event.key, targetElement, event.shiftKey, event.metaKey);
        event.preventDefault();
      } else if (!modifierKeyPressed && targetElement.classList.contains("hex")) {
        await this.editHandler.editHex(targetElement, event.key);
        if (targetElement.innerText.trimRight().length == 2 && targetElement.classList.contains("editing")) {
          targetElement.classList.remove("editing");
          this.navigateByKey("ArrowRight", targetElement, false, false);
        }
      } else if (!modifierKeyPressed && event.key.length === 1 && targetElement.classList.contains("ascii")) {
        await this.editHandler.editAscii(targetElement, event.key);
        targetElement.classList.remove("editing");
        this.navigateByKey("ArrowRight", targetElement, false, false);
      }
      await this.editHandler.completePendingEdits();
    }
    windowKeyboardHandler(event) {
      if (!event || !event.target)
        return;
      if ((event.metaKey || event.ctrlKey) && event.key === "f") {
        this.searchHandler.searchKeybindingHandler();
      } else if ((event.key == "Home" || event.key == "End") && event.ctrlKey) {
        event.key == "Home" ? this.scrollBarHandler.scrollToTop() : this.scrollBarHandler.scrollToBottom();
      } else if (event.key == "PageUp") {
        this.scrollBarHandler.page(this.viewPortHeight, "up");
      } else if (event.key == "PageDown") {
        this.scrollBarHandler.page(this.viewPortHeight, "down");
      }
    }
    navigateByKey(keyName, targetElement, isRangeSelection, metaKey) {
      let next;
      switch (keyName) {
        case "ArrowLeft":
          next = (isMac && metaKey ? this._getStartOfLineCell : this._getPreviousCell)(targetElement);
          break;
        case "ArrowRight":
          next = (isMac && metaKey ? this._getEndOfLineCell : this._getNextCell)(targetElement);
          break;
        case "ArrowUp":
          next = this._getCellAbove(targetElement);
          break;
        case "ArrowDown":
          next = this._getCellBelow(targetElement);
          break;
        case "End":
          next = this._getEndOfLineCell(targetElement);
          break;
        case "Home":
          next = this._getStartOfLineCell(targetElement);
          break;
      }
      if ((next == null ? void 0 : next.tagName) === "SPAN") {
        const nextRect = next.getBoundingClientRect();
        if (this.viewPortHeight <= nextRect.bottom) {
          this.scrollBarHandler.scrollDocument(1, "down");
        } else if (nextRect.top <= 0) {
          this.scrollBarHandler.scrollDocument(1, "up");
        }
        const offset = getElementsOffset(next);
        this.selectHandler.setFocused(offset);
        const startSelection = this.selectHandler.getSelectionStart();
        const currentSelection = this.selectHandler.getSelected();
        if (isRangeSelection && startSelection !== void 0) {
          const min = Math.min(startSelection, offset);
          const max = Math.max(offset, currentSelection[currentSelection.length - 1]);
          this.selectHandler.setSelected(createOffsetRange(min, max));
        } else {
          this.selectHandler.setSelected([offset]);
          this.updateInspector();
        }
        next.focus({ preventScroll: true });
      }
    }
    _getPreviousCell(currentCell) {
      var _a, _b;
      return currentCell.previousElementSibling || ((_b = (_a = currentCell.parentElement) == null ? void 0 : _a.previousElementSibling) == null ? void 0 : _b.children[15]);
    }
    _getNextCell(currentCell) {
      var _a, _b;
      return currentCell.nextElementSibling || ((_b = (_a = currentCell.parentElement) == null ? void 0 : _a.nextElementSibling) == null ? void 0 : _b.children[0]);
    }
    _getStartOfLineCell(currentCell) {
      return currentCell.parentElement.children[0];
    }
    _getEndOfLineCell(currentCell) {
      const parentChildren = currentCell.parentElement.children;
      return parentChildren[parentChildren.length - 1];
    }
    _getCellAbove(currentCell) {
      const elements_above = getElementsWithGivenOffset(getElementsOffset(currentCell) - 16);
      if (elements_above.length === 0) {
        return void 0;
      }
      return currentCell.classList.contains("hex") ? elements_above[0] : elements_above[1];
    }
    _getCellBelow(currentCell) {
      const elements_below = getElementsWithGivenOffset(Math.min(getElementsOffset(currentCell) + 16, this.fileSize - 1));
      if (elements_below.length === 0) {
        return void 0;
      }
      return currentCell.classList.contains("hex") ? elements_below[0] : elements_below[1];
    }
    updateInspector() {
      const offset = this.selectHandler.getSelectionStart();
      if (offset !== void 0) {
        const elements = getElementsWithGivenOffset(offset);
        const byte_obj = retrieveSelectedByteObject(elements);
        DataInspectorHandler.updateInspector(byte_obj);
      }
    }
    setSelection(offsets) {
      this.selectHandler.setSelected(offsets);
    }
    focusElementWithGivenOffset(offset, column) {
      const elements = getElementsWithGivenOffset(offset);
      if (elements.length != 2)
        return;
      this.selectHandler.setSelected([offset]);
      this.updateInspector();
      if (!column && document.activeElement && getElementsColumn(document.activeElement) === "ascii" || column === "ascii") {
        elements[1].focus();
      } else {
        elements[0].focus();
      }
    }
    undo(edits, fileSize) {
      this.fileSize = fileSize;
      this.editHandler.undo(edits);
    }
    redo(edits, fileSize) {
      this.editHandler.redo(edits);
      this.fileSize = fileSize;
    }
    revert(fileSize) {
      this.fileSize = fileSize;
      this.editHandler.revert();
    }
    createAddCell() {
      var _a, _b;
      if (document.getElementsByClassName("add-cell").length !== 0)
        return;
      const packet = {
        offset: this.fileSize,
        data: new ByteData(0)
      };
      if (this.fileSize % 16 === 0) {
        this.render([packet]);
        if (this.fileSize % chunkHandler.chunkSize === 0) {
          chunkHandler.addChunk(this.fileSize);
        }
        this.scrollBarHandler.updateScrollBar(this.fileSize / 16);
      } else {
        const hex_element = this.createHexElement(packet);
        const ascii_element = this.createAsciiElement(packet);
        const elements = getElementsWithGivenOffset(this.fileSize - 1);
        (_a = elements[0].parentElement) == null ? void 0 : _a.appendChild(hex_element);
        (_b = elements[1].parentElement) == null ? void 0 : _b.appendChild(ascii_element);
      }
    }
    removeLastCell() {
      var _a, _b, _c;
      const plusCellOffset = getElementsOffset(document.getElementsByClassName("add-cell")[0]);
      if (isNaN(plusCellOffset))
        return;
      const lastCells = getElementsWithGivenOffset(plusCellOffset);
      const secondToLastCells = getElementsWithGivenOffset(plusCellOffset - 1);
      if (plusCellOffset % 16 === 0) {
        (_a = this.rows[0].get(plusCellOffset.toString())) == null ? void 0 : _a.remove();
        this.rows[0].delete(plusCellOffset.toString());
        (_b = this.rows[1].get(plusCellOffset.toString())) == null ? void 0 : _b.remove();
        this.rows[1].delete(plusCellOffset.toString());
        (_c = this.rows[2].get(plusCellOffset.toString())) == null ? void 0 : _c.remove();
        this.rows[2].delete(plusCellOffset.toString());
        this.scrollBarHandler.updateScrollBar((plusCellOffset - 1) / 16);
      } else {
        lastCells[0].remove();
        lastCells[0].remove();
      }
      secondToLastCells[0].innerText = "+";
      secondToLastCells[0].classList.add("add-cell");
      secondToLastCells[0].classList.remove("nongraphic");
      secondToLastCells[0].classList.remove("edited");
      secondToLastCells[1].innerText = "+";
      secondToLastCells[1].classList.remove("nongraphic");
      secondToLastCells[1].classList.add("add-cell");
      secondToLastCells[1].classList.remove("edited");
    }
    get documentSize() {
      return this.fileSize;
    }
    updateDocumentSize(newSize) {
      this.fileSize = newSize;
    }
    async reRequestChunks() {
      var _a, _b, _c;
      const allChunks = Array.from(chunkHandler.allChunks);
      for (const chunk of allChunks) {
        for (let i = chunk; i < chunk + chunkHandler.chunkSize; i += 16) {
          (_a = this.rows[0].get(i.toString())) == null ? void 0 : _a.remove();
          this.rows[0].delete(i.toString());
          (_b = this.rows[1].get(i.toString())) == null ? void 0 : _b.remove();
          this.rows[1].delete(i.toString());
          (_c = this.rows[2].get(i.toString())) == null ? void 0 : _c.remove();
          this.rows[2].delete(i.toString());
        }
        chunkHandler.removeChunk(chunk);
        await chunkHandler.requestMoreChunks(chunk);
      }
    }
    async scrollDocumentToOffset(offset, force) {
      return this.scrollBarHandler.scrollToOffset(offset, force);
    }
  };

  // media/editor/chunkHandler.ts
  var ChunkHandler = class {
    constructor(chunkSize) {
      this.chunks = new Set();
      this._chunkSize = chunkSize;
    }
    get chunkSize() {
      return this._chunkSize;
    }
    hasChunk(offset) {
      const chunkStart = this.retrieveChunkStart(offset);
      return this.chunks.has(chunkStart);
    }
    async requestMoreChunks(chunkStart) {
      if (chunkStart >= virtualHexDocument.documentSize && chunkStart !== 0)
        return;
      try {
        const request = await messageHandler.postMessageWithResponse("packet", {
          initialOffset: chunkStart,
          numElements: this.chunkSize
        });
        this.processChunks(request.offset, request.data, request.edits, request.fileSize);
      } catch (err) {
        return;
      }
    }
    retrieveChunkStart(offset) {
      return Math.floor(offset / this.chunkSize) * this.chunkSize;
    }
    async ensureBuffer(offset, bufferOpts) {
      const chunksToRequest = new Set();
      const chunkStart = this.retrieveChunkStart(offset);
      chunksToRequest.add(chunkStart);
      for (let i = 1; i <= bufferOpts.topBufferSize; i++) {
        chunksToRequest.add(Math.max(0, chunkStart - i * this.chunkSize));
      }
      for (let i = 1; i <= bufferOpts.bottomBufferSize; i++) {
        chunksToRequest.add(chunkStart + i * this.chunkSize);
      }
      const chunksToRequestArr = [...chunksToRequest].filter((x) => !this.chunks.has(x));
      const chunksOutsideBuffer = [...this.chunks].filter((x) => !chunksToRequest.has(x));
      chunksOutsideBuffer.forEach((chunk) => this.removeChunk(chunk));
      const requested = [];
      chunksToRequestArr.forEach((chunkOffset) => requested.push(this.requestMoreChunks(chunkOffset)));
      const result = {
        removed: chunksOutsideBuffer,
        requested: Promise.all(requested)
      };
      return result;
    }
    processChunks(offset, data, edits, fileSize) {
      const packets = [];
      for (let i = 0; i < data.length; i++) {
        if ((i + offset) % this.chunkSize === 0) {
          this.addChunk(i + offset);
        }
        packets.push({
          offset: i + offset,
          data: new ByteData(data[i])
        });
        if (i + offset + 1 === virtualHexDocument.documentSize) {
          packets.push({
            offset: i + offset + 1,
            data: new ByteData(0)
          });
        }
      }
      if (data.length === 0 && fileSize === 0) {
        packets.push({
          offset: 0,
          data: new ByteData(0)
        });
      }
      virtualHexDocument.render(packets);
      virtualHexDocument.redo(edits, fileSize);
    }
    addChunk(offset) {
      this.chunks.add(offset);
    }
    removeChunk(offset) {
      this.chunks.delete(offset);
    }
    get allChunks() {
      return this.chunks;
    }
  };

  // media/editor/messageHandler.ts
  var MessageHandler = class {
    constructor(maximumRequests) {
      this.maxRequests = maximumRequests;
      this.requestsMap = new Map();
      this.requestId = 0;
    }
    async postMessageWithResponse(type, body) {
      var _a;
      const promise = new Promise((resolve, reject) => this.requestsMap.set(this.requestId, { resolve, reject }));
      if (this.requestsMap.size > this.maxRequests) {
        const removed = this.requestsMap.keys().next().value;
        (_a = this.requestsMap.get(removed)) == null ? void 0 : _a.reject("Request Timed out");
        this.requestsMap.delete(removed);
      }
      vscode.postMessage({ requestId: this.requestId++, type, body });
      return promise;
    }
    postMessage(type, body) {
      vscode.postMessage({ type, body });
    }
    incomingMessageHandler(message) {
      const request = this.requestsMap.get(message.requestId);
      if (!request)
        return;
      request.resolve(message.body);
      this.requestsMap.delete(message.requestId);
    }
  };

  // media/editor/hexEdit.ts
  var vscode = acquireVsCodeApi();
  var virtualHexDocument;
  var chunkHandler = new ChunkHandler(800);
  var messageHandler = new MessageHandler(10);
  function openAnyway() {
    messageHandler.postMessage("open-anyways");
  }
  (() => {
    window.addEventListener("message", async (e) => {
      const { type, body } = e.data;
      switch (type) {
        case "init":
          if (body.html !== void 0) {
            document.getElementsByTagName("body")[0].innerHTML = body.html;
            virtualHexDocument = new VirtualDocument(body.fileSize, body.editorFontSize, body.baseAddress);
            chunkHandler.ensureBuffer(virtualHexDocument.topOffset(), {
              topBufferSize: 0,
              bottomBufferSize: 5
            });
          }
          if (body.fileSize != 0 && body.html === void 0) {
            document.getElementsByTagName("body")[0].innerHTML = `
						<div>
						<p>Opening this large file may cause instability. <a id="open-anyway" href="#">Open anyways</a></p>
						</div>
											`;
            document.getElementById("open-anyway").addEventListener("click", openAnyway);
            return;
          }
          return;
        case "update":
          if (body.type === "undo") {
            virtualHexDocument.undo(body.edits, body.fileSize);
          } else if (body.type === "redo") {
            virtualHexDocument.redo(body.edits, body.fileSize);
          } else {
            virtualHexDocument.revert(body.fileSize);
          }
          return;
        case "save":
          const dirtyCells = Array.from(document.getElementsByClassName("edited"));
          dirtyCells.map((cell) => cell.classList.remove("edited"));
          return;
        case "goToOffset":
          const offset = parseInt(body.offset, 16);
          virtualHexDocument.scrollDocumentToOffset(offset).then(() => {
            setTimeout(() => virtualHexDocument.focusElementWithGivenOffset(offset), 10);
          });
          return;
        default:
          messageHandler.incomingMessageHandler(e.data);
          return;
      }
    });
    messageHandler.postMessage("ready");
  })();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbWVkaWEvZWRpdG9yL2J5dGVEYXRhLnRzIiwgIi4uL21lZGlhL2VkaXRvci91dGlsLnRzIiwgIi4uL21lZGlhL2VkaXRvci9ldmVudEhhbmRsZXJzLnRzIiwgIi4uL21lZGlhL2VkaXRvci93ZWJ2aWV3U3RhdGVNYW5hZ2VyLnRzIiwgIi4uL21lZGlhL2VkaXRvci9zY3JvbGxCYXJIYW5kbGVyLnRzIiwgIi4uL21lZGlhL2VkaXRvci9zZWxlY3RIYW5kbGVyLnRzIiwgIi4uL21lZGlhL2VkaXRvci9lZGl0SGFuZGxlci50cyIsICIuLi9tZWRpYS9lZGl0b3Ivc2VhcmNoSGFuZGxlci50cyIsICIuLi9tZWRpYS9lZGl0b3IvZGF0YUluc3BlY3RvckhhbmRsZXIudHMiLCAiLi4vbWVkaWEvZWRpdG9yL3ZpcnR1YWxEb2N1bWVudC50cyIsICIuLi9tZWRpYS9lZGl0b3IvY2h1bmtIYW5kbGVyLnRzIiwgIi4uL21lZGlhL2VkaXRvci9tZXNzYWdlSGFuZGxlci50cyIsICIuLi9tZWRpYS9lZGl0b3IvaGV4RWRpdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbmV4cG9ydCBjbGFzcyBCeXRlRGF0YSB7XG5cdHByaXZhdGUgZGVjaW1hbDogbnVtYmVyO1xuXHRwcml2YXRlIGFkamFjZW50Qnl0ZXM6IEJ5dGVEYXRhW107XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgQnl0ZURhdGEgb2JqZWN0IHdoaWNoIGFjdHMgYXMgdGhlIGRhdGFsYXllciBmb3IgYSBzaW5nbGUgaGV4IHZhbHVlXG5cdCAqIEBwYXJhbSB1aW50OG51bSBUaGUgOGJpdCBudW1iZXIgZnJvbSB0aGUgZmlsZSB0byBiZSByZXByZXNlbnRlZFxuXHQgKi9cblx0Y29uc3RydWN0b3IodWludDhudW06IG51bWJlcikge1xuXHRcdHRoaXMuZGVjaW1hbCA9IHVpbnQ4bnVtO1xuXHRcdHRoaXMuYWRqYWNlbnRCeXRlcyA9IFtdO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBBZGRzIGEgZ2l2ZW4gQnl0ZURhdGEgb2JqZWN0IGFzIGFkamFuY2VudCB0byB0aGUgY3VycmVudCBvbmUgKHV0aWxpemVkIGZvciBoaWdoZXIgdGhhbiA4Yml0IGNhbGN1bGF0aW9ucylcblx0ICogQHBhcmFtIHtCeXRlRGF0YX0gYnl0ZV9vYmogVGhlIEJ5dGVEYXRhIG9idmplY3QgdG8gYWRkIHRvIHRoZSBhcnJheVxuXHQgKi9cblx0YWRkQWRqYWNlbnRCeXRlKGJ5dGVfb2JqOiBCeXRlRGF0YSk6IHZvaWQge1xuXHRcdHRoaXMuYWRqYWNlbnRCeXRlcy5wdXNoKGJ5dGVfb2JqKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gUmV0dXJucyB0aGUgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBCeXRlRGF0YSBvYmplY3Rcblx0ICogQHJldHVybnMge3N0cmluZ30gVGhlIEJ5dGVEYXRhIHJlcHJlc2VudGVkIGFzIGEgaGV4IHN0cmluZ1xuXHQgKi9cblx0dG9IZXgoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5kZWNpbWFsLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBSZXR1cm5zIHRoZSA4Yml0IHVuc2lnbmVkIGludCByZXByZXNlbnRhdGlvbiBvZiB0aGUgQnl0ZURhdGEgb2JqZWN0XG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSA4IGJpdCB1bnNpZ25lZCBpbnRcblx0ICovXG5cdHRvOGJpdFVJbnQoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy5kZWNpbWFsO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBDb252ZXJ0cyB0aGUgYnl0ZSBkYXRhIHRvIGEgdXRmLTggY2hhcmFjdGVyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbGl0dGxlRW5kaWFuIFdoZXRoZXIgb3Igbm90IGl0J3MgcmVwcmVzZW50ZWQgaW4gbGl0dGxlIGVuZGlhblxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgdXRmLTggY2hhcmFjdGVyXG5cdCAqL1xuXHR0b1VURjgobGl0dGxlRW5kaWFuOiBib29sZWFuKTogc3RyaW5nIHtcblx0XHRsZXQgdWludDhEYXRhID0gW3RoaXMudG84Yml0VUludCgpXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDMgJiYgaSA8IHRoaXMuYWRqYWNlbnRCeXRlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dWludDhEYXRhLnB1c2godGhpcy5hZGphY2VudEJ5dGVzW2ldLnRvOGJpdFVJbnQoKSk7XG5cdFx0fVxuXHRcdGlmICghbGl0dGxlRW5kaWFuKSB7XG5cdFx0XHR1aW50OERhdGEgPSB1aW50OERhdGEucmV2ZXJzZSgpO1xuXHRcdH1cblx0XHRjb25zdCB1dGY4ID0gbmV3IFRleHREZWNvZGVyKFwidXRmLThcIikuZGVjb2RlKG5ldyBVaW50OEFycmF5KHVpbnQ4RGF0YSkpO1xuXHRcdC8vIFdlIGl0ZXJhdGUgdGhyb3VnaCB0aGUgc3RyaW5nIGFuZCBpbW1lZGlhdGVseSByZXV0cm4gdGhlIGZpcnN0IGNoYXJhY3RlclxuXHRcdGZvciAoY29uc3QgY2hhciBvZiB1dGY4KSByZXR1cm4gY2hhcjtcblx0XHRyZXR1cm4gdXRmODtcblx0fVxufSIsICIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgQnl0ZURhdGEgfSBmcm9tIFwiLi9ieXRlRGF0YVwiO1xuXG4vLyBBc3NvcnRlZCBoZWxwZXIgZnVuY3Rpb25zXG5cbmV4cG9ydCBjb25zdCBpc01hYyA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1hYyBPUyBYXCIpID49IDA7XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIENsYXNzIHdoaWNoIHJlcHJlc2VudHMgYSByYW5nZSBvZiBudW1iZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBSYW5nZSB7XG5cdHB1YmxpYyByZWFkb25seSBzdGFydDogbnVtYmVyO1xuXHRwdWJsaWMgcmVhZG9ubHkgZW5kOiBudW1iZXI7XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBDb25zdHJ1Y3RzIGEgcmFuZ2Ugb2JqZWN0IHJlcHJlc2VudGluZyBbc3RhcnQsIGVuZF0gaW5jbHVzaXZlIG9mIGJvdGhcblx0ICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFJlcHJlc2VudHMgdGhlIHN0YXJ0IG9mIHRoZSByYW5nZVxuXHQgKiBAcGFyYW0ge251bWJlcn0gZW5kIFJlcHJlc2VudHMgdGhlIGVuZCBvZiB0aGUgcmFuZ2Vcblx0ICovXG5cdGNvbnN0cnVjdG9yKHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyID0gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpIHtcblx0XHRpZiAoc3RhcnQgPiBlbmQpIHtcblx0XHRcdHRoaXMuc3RhcnQgPSBlbmQ7XG5cdFx0XHR0aGlzLmVuZCA9IHN0YXJ0O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnN0YXJ0ID0gc3RhcnQ7XG5cdFx0XHR0aGlzLmVuZCA9IGVuZDtcblx0XHR9XG5cdH1cblx0LyoqXG5cdCAqIEBkZXNjaXB0aW9uIFRlc3RzIGlmIHRoZSBnaXZlbiBudW1iZXIgaWYgd2l0aGluIHRoZSByYW5nZVxuXHQgKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdG8gdGVzdFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbiB9IFRydWUgaWYgdGhlIG51bWJlciBpcyBpbiB0aGUgcmFuZ2UsIGZhbHNlIG90aGVyd2lzZVxuXHQgKi9cblx0YmV0d2VlbihudW06IG51bWJlcik6IGJvb2xlYW4ge1xuXHRcdGlmICh0aGlzLmVuZCkge1xuXHRcdFx0cmV0dXJuIG51bSA+PSB0aGlzLnN0YXJ0ICYmIG51bSA8PSB0aGlzLmVuZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bSA+PSB0aGlzLnN0YXJ0O1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBDaGVja3MgaWYgdGhlIGdpdmVuIG51bWJlciBpcyBpbiBhbnkgb2YgdGhlIHJhbmdlc1xuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRvIHVzZSB3aGVuIGNoZWNraW5nIHRoZSByYW5nZXNcbiAqIEBwYXJhbSB7UmFuZ2VbXX0gcmFuZ2VzIFRoZSByYW5nZXMgdG8gY2hlY2sgdGhlIG51bWJlciBhZ2FpbnN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbnVtYmVyIGlzIGluIGFueSBvZiB0aGUgcmFuZ2VzLCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhpbkFueVJhbmdlKG51bTogbnVtYmVyLCByYW5nZXM6IFJhbmdlW10pOiBib29sZWFuIHtcblx0Zm9yIChjb25zdCByYW5nZSBvZiByYW5nZXMpIHtcblx0XHRpZiAocmFuZ2UuYmV0d2VlbihudW0pKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgbGlzdCBvZiByYW5nZXMgY29udGFpbmluZyB0aGUgbm9uIHJlbmRlcmFibGUgOCBiaXQgY2hhciBjb2Rlc1xuICogQHJldHVybnMge1JhbmdlW119IFRoZSByYW5nZXMgd2hpY2ggcmVwcmVzZW50IHRoZSBub24gcmVuZGVyYWJsZSA4IGJpdCBjaGFyIGNvZGVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNoYXJhY3RlclJhbmdlcygpOiBSYW5nZVtdIHtcblx0Y29uc3QgcmFuZ2VzOiBSYW5nZVtdID0gW107XG5cdHJhbmdlcy5wdXNoKG5ldyBSYW5nZSgwLCAzMSkpO1xuXHRyYW5nZXMucHVzaChuZXcgUmFuZ2UoMTI3LCAxNjApKTtcblx0cmFuZ2VzLnB1c2gobmV3IFJhbmdlKDE3MywgMTczKSk7XG5cdHJhbmdlcy5wdXNoKG5ldyBSYW5nZSgyNTYpKTtcblx0cmV0dXJuIHJhbmdlcztcbn1cblxuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBHaXZlbiBhbiBvZmZzZXQgZ2V0cyBhbGwgc3BhbnMgd2l0aCB0aGF0IG9mZnNldFxuICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBUaGUgb2Zmc2V0IHRvIGZpbmQgZWxlbWVudHMgb2ZcbiAqIEByZXR1cm5zIHtIVE1MQ29sbGVjdGlvbk9mPEhUTUxFbGVtZW50Pn0gcmV0dXJucyBhIGxpc3Qgb2YgSFRNTEVsZW1lbnRzIHdoaWNoIGhhdmUgdGhlIGdpdmVuIG9mZnNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudHNXaXRoR2l2ZW5PZmZzZXQob2Zmc2V0OiBudW1iZXIpOiBIVE1MQ29sbGVjdGlvbk9mPEhUTUxFbGVtZW50PiB7XG5cdHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGBjZWxsLW9mZnNldC0ke29mZnNldH1gKSBhcyBIVE1MQ29sbGVjdGlvbk9mPEhUTUxFbGVtZW50Pjtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb24gR2l2ZW4gYW4gZWxlbWVudCByZXR1cm5zIGl0cyBvZmZzZXQgb3IgTmFOIGlmIGl0IGRvZXNuJ3QgaGF2ZSBvbmVcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gZ2V0IHRoZSBvZmZzZXQgb2ZcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIG9mZnNldCBvZiB0aGUgZWxlbWVudCBvciBOYU5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnRzT2Zmc2V0KGVsZW1lbnQ6IEVsZW1lbnQpOiBudW1iZXIge1xuXHRmb3IgKGNvbnN0IGN1cnJlbnRDbGFzcyBvZiBlbGVtZW50LmNsYXNzTGlzdCkge1xuXHRcdGlmIChjdXJyZW50Q2xhc3MuaW5kZXhPZihcImNlbGwtb2Zmc2V0XCIpICE9PSAtMSkge1xuXHRcdFx0Y29uc3Qgb2Zmc2V0ID0gcGFyc2VJbnQoY3VycmVudENsYXNzLnJlcGxhY2UoXCJjZWxsLW9mZnNldC1cIiwgXCJcIikpO1xuXHRcdFx0cmV0dXJuIG9mZnNldDtcblx0XHR9XG5cdH1cblx0cmV0dXJuIE5hTjtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb24gR2l2ZW4gYW4gZWxlbWVudCB0cnlzIHRvIGRpc2Nlcm4gd2hldGhlciBpdCBiZWxvbmdzIHRvIHRoZSBoZXggb3IgYXNjaWkgY29sdW1uLCBlbHNlIHJldHVybnMgdW5kZWZpbmVkXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB3aG8ncyBjb2x1bW4geW91IHdhbnQgdG8ga25vdyBhYm91dFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudHNDb2x1bW4oZWxlbWVudDogRWxlbWVudCk6IFwiYXNjaWlcIiB8IFwiaGV4XCIgfCB1bmRlZmluZWQge1xuXHRpZiAoZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJoZXhcIikpIHJldHVybiBcImhleFwiO1xuXHRpZiAoZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJhc2NpaVwiKSkgcmV0dXJuIFwiYXNjaWlcIjtcblx0cmV0dXJuO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBSZXR1cm5zIHRoZSBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIG9mZnNldCBhcyB0aGUgb25lIGNsaWNrZWRcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgVGhlIGV2ZW50IHdoaWNoIGlzIGhhbmRlZCB0byBhIG1vdXNlIGV2ZW50IGxpc3RlbmVyXG4gKiBAcmV0dXJucyB7SFRNTENvbGxlY3Rpb25PZjxFbGVtZW50PiB8IEFycmF5PEVsZW1lbnQ+fSBUaGUgZWxlbWVudHMgd2l0aCB0aGUgc2FtZSBvZmZzZXQgYXMgdGhlIGNsaWNrZWQgZWxlbWVudCwgb3IgdW5kZWZpbmVkIGlmIG5vbmUgY291bGQgYmUgcmV0cmlldmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbGVtZW50c0dpdmVuTW91c2VFdmVudChldmVudDogTW91c2VFdmVudCk6IEhUTUxDb2xsZWN0aW9uT2Y8RWxlbWVudD4gfCBBcnJheTxFbGVtZW50PiB7XG5cdGlmICghZXZlbnQgfHwgIWV2ZW50LnRhcmdldCkgcmV0dXJuIFtdO1xuXHRjb25zdCBob3ZlcmVkID0gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQ7XG5cdHJldHVybiBnZXRFbGVtZW50c1dpdGhHaXZlbk9mZnNldChnZXRFbGVtZW50c09mZnNldChob3ZlcmVkKSk7XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIEdpdmVuIGEgYnl0ZWRhdGEgb2JqZWN0IHVwZGF0ZXMgdGhlIGFzY2lpIGVsZW1lbnQgd2l0aCB0aGUgY29ycmVjdCBkZWNvZGVkIHRleHRcbiAqIEBwYXJhbSB7Qnl0ZURhdGF9IGJ5dGVEYXRhIFRoZSBvYmplY3QgY29udGFpbmluZyBpbmZvcm1hdGlvbiBhYm91dCBhIGdpdmVuIGJ5dGVcbiAqIEBwYXJhbSB7SFRNTFNwYW5FbGVtZW50fSBhc2NpaUVsZW1lbnQgVGhlIGRlY29kZWQgdGV4dCBlbGVtZW50IG9uIHRoZSBET01cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUFzY2lpVmFsdWUoYnl0ZURhdGE6IEJ5dGVEYXRhLCBhc2NpaUVsZW1lbnQ6IEhUTUxTcGFuRWxlbWVudCk6IHZvaWQge1xuXHRhc2NpaUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcIm5vbmdyYXBoaWNcIik7XG5cdC8vIElmIGl0J3Mgc29tZSBzb3J0IG9mIGNoYXJhY3RlciB3ZSBjYW5ub3QgcmVuZGVyIHdlIGp1c3QgcmVwcmVzZW50IGl0IGFzIGEgcGVyaW9kIHdpdGggdGhlIG5vZ3JhcGhpYyBjbGFzc1xuXHRpZiAod2l0aGluQW55UmFuZ2UoYnl0ZURhdGEudG84Yml0VUludCgpLCBnZW5lcmF0ZUNoYXJhY3RlclJhbmdlcygpKSkge1xuXHRcdGFzY2lpRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwibm9uZ3JhcGhpY1wiKTtcblx0XHRhc2NpaUVsZW1lbnQuaW5uZXJUZXh0ID0gXCIuXCI7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3QgYXNjaWlfY2hhciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZURhdGEudG84Yml0VUludCgpKTtcblx0XHRhc2NpaUVsZW1lbnQuaW5uZXJUZXh0ID0gYXNjaWlfY2hhcjtcblx0fVxufVxuXG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIEdpdmVuIGEgc3RyaW5nIDAgcGFkcyBpdCB1cCB1bml0bCB0aGUgc3RyaW5nIGlzIG9mIGxlbmd0aCB3aWR0aFxuICogQHBhcmFtIHtzdHJpbmd9IG51bWJlciBUaGUgbnVtYmVyIHlvdSB3YW50IHRvIDAgcGFkIChpdCdzIGEgc3RyaW5nIGFzIHlvdSdyZSAwIHBhZGRpbmcgaXQgdG8gZGlzcGxheSBpdCwgbm90IHRvIGRvIGFyaXRobWV0aWMpXG4gKiBAcGFyYW0ge251bWJlcn0gd2lkdGggVGhlIGxlbmd0aCBvZiB0aGUgZmluYWwgc3RyaW5nIChpZiBzbWFsbGVyIHRoYW4gdGhlIHN0cmluZyBwcm92aWRlZCBub3RoaW5nIGhhcHBlbnMpXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgbmV3bHkgcGFkZGVkIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFkKG51bWJlcjogc3RyaW5nLCB3aWR0aDogbnVtYmVyKTogc3RyaW5nIHtcblx0bnVtYmVyID0gbnVtYmVyICsgXCJcIjtcblx0cmV0dXJuIG51bWJlci5sZW5ndGggPj0gd2lkdGggPyBudW1iZXIgOiBuZXcgQXJyYXkod2lkdGggLSBudW1iZXIubGVuZ3RoICsgMSkuam9pbihcIjBcIikgKyBudW1iZXI7XG59XG5cblxuLyoqXG4gKiBAZGVzY3JpcHRpb24gR2l2ZW4gdHdvIGVsZW1lbnRzICh0aGUgaGV4IGFuZCBhc2NpaSBlbGVtZW50cyksIHJldHVybnMgYSBCeXRlRGF0YSBvYmplY3QgcmVwcmVzZW50aW5nIGJvdGggb2YgdGhlbVxuICogQHBhcmFtIHtIVE1MQ29sbGVjdGlvbk9mPEVsZW1lbnQ+fSBlbGVtZW50cyBUaGUgZWxlbWVudHMgcmVwcmVzZW50aW5nIHRoZSBoZXggYW5kIGFzc29jaWF0ZWQgYXNjaWkgb24gdGhlIERPTVxuICogQHJldHVybnMge0J5dGVEYXRhIHwgdW5kZWZpbmVkfSBUaGUgQnl0ZURhdGEgb2JqZWN0IG9yIHVuZGVmaW5lZCBpZiBlbGVtZW50cyB3YXMgbWFsZm9ybWVkIG9yIGVtcHR5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXRyaWV2ZVNlbGVjdGVkQnl0ZU9iamVjdChlbGVtZW50czogSFRNTENvbGxlY3Rpb25PZjxFbGVtZW50Pik6IEJ5dGVEYXRhIHwgdW5kZWZpbmVkIHtcblx0Zm9yIChjb25zdCBlbGVtZW50IG9mIEFycmF5LmZyb20oZWxlbWVudHMpKSB7XG5cdFx0aWYgKGVsZW1lbnQucGFyZW50RWxlbWVudCAmJiBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImhleFwiKSkge1xuXHRcdFx0Y29uc3QgYnl0ZV9vYmplY3QgPSBuZXcgQnl0ZURhdGEocGFyc2VJbnQoZWxlbWVudC5pbm5lckhUTUwsIDE2KSk7XG5cdFx0XHRsZXQgY3VycmVudF9lbGVtZW50ID0gZWxlbWVudC5uZXh0RWxlbWVudFNpYmxpbmcgfHwgZWxlbWVudC5wYXJlbnRFbGVtZW50Lm5leHRFbGVtZW50U2libGluZz8uY2hpbGRyZW5bMF07XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDc7IGkrKykge1xuXHRcdFx0XHRpZiAoIWN1cnJlbnRfZWxlbWVudCB8fCBjdXJyZW50X2VsZW1lbnQuaW5uZXJIVE1MID09PSBcIitcIikgYnJlYWs7XG5cdFx0XHRcdGJ5dGVfb2JqZWN0LmFkZEFkamFjZW50Qnl0ZShuZXcgQnl0ZURhdGEocGFyc2VJbnQoY3VycmVudF9lbGVtZW50LmlubmVySFRNTCwgMTYpKSk7XG5cdFx0XHRcdGN1cnJlbnRfZWxlbWVudCA9IGN1cnJlbnRfZWxlbWVudC5uZXh0RWxlbWVudFNpYmxpbmcgfHwgY3VycmVudF9lbGVtZW50LnBhcmVudEVsZW1lbnQ/Lm5leHRFbGVtZW50U2libGluZz8uY2hpbGRyZW5bMF07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYnl0ZV9vYmplY3Q7XG5cdFx0fVxuXHR9XG5cdHJldHVybjtcbn1cbi8qKlxuICogQGRlc2NyaXB0aW9uIEdpdmVuIGEgc3RhcnQgYW5kIGVuZCBvZmZzZXQgY3JlYXRlcyBhbiBhcnJheSBjb250YWluaW5nIGFsbCB0aGUgb2Zmc2V0cyBpbiBiZXR3ZWVuLCBpbmNsdXNpdmUgb2Ygc3RhcnQgYW5kIGVuZFxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0T2Zmc2V0IFRoZSBvZmZzZXQgd2hpY2ggZGVmaW5lcyB0aGUgc3RhcnQgb2YgdGhlIHJhbmdlXG4gKiBAcGFyYW0ge251bWJlcn0gZW5kT2Zmc2V0IFRoZSBvZmZzZXQgd2hpY2ggZGVmaW5lcyB0aGUgZW5kIG9mIHRoZSByYW5nZVxuICogQHJldHVybnMge251bWJlcltdfSBUaGUgcmFuZ2UgW3N0YXJ0T2Zmc2V0LCBlbmRPZmZzZXRdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVPZmZzZXRSYW5nZShzdGFydE9mZnNldDogbnVtYmVyLCBlbmRPZmZzZXQ6IG51bWJlcik6IG51bWJlcltdIHtcblx0Y29uc3Qgb2Zmc2V0c1RvU2VsZWN0ID0gW107XG5cdC8vIFdlIGZsaXAgdGhlbSBzbyB0aGF0IHRoZSBmb3IgbG9vcCBjcmVhdGVzIHRoZSByYW5nZSBjb3JyZWN0bHlcblx0aWYgKGVuZE9mZnNldCA8IHN0YXJ0T2Zmc2V0KSB7XG5cdFx0Y29uc3QgdGVtcCA9IGVuZE9mZnNldDtcblx0XHRlbmRPZmZzZXQgPSBzdGFydE9mZnNldDtcblx0XHRzdGFydE9mZnNldCA9IHRlbXA7XG5cdH1cblx0Ly8gQ3JlYXRlIGFuIGFycmF5IG9mIG9mZnNldHMgd2l0aCBldmVyeXRoaW5nIGJldHdlZW4gdGhlIGxhc3Qgc2VsZWN0ZWQgZWxlbWVudCBhbmQgd2hhdCB0aGUgdXNlciBoaXQgc2hpZnRcblx0Zm9yIChsZXQgaSA9IHN0YXJ0T2Zmc2V0OyBpIDw9IGVuZE9mZnNldDsgaSsrKSB7XG5cdFx0b2Zmc2V0c1RvU2VsZWN0LnB1c2goaSk7XG5cdH1cblx0cmV0dXJuIG9mZnNldHNUb1NlbGVjdDtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb24gQ29udmVydHMgYSBoZXggcXVlcnkgdG8gYSBzdHJpbmcgYXJyYXkgaWdub3Jpbmcgc3BhY2VzLCBpZiBub3QgZXZlbmx5IGRpdmlzaWJsZSB3ZSBhcHBlbmQgYSBsZWFkaW5nIDBcbiAqIGkuZSBBIC0+IDBBXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgVGhlIHF1ZXJ5IHRvIGNvbnZlcnQgdG8gYW4gYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhleFF1ZXJ5VG9BcnJheShxdWVyeTogc3RyaW5nKTogc3RyaW5nW10ge1xuXHRsZXQgY3VycmVudENoYXJhY3RlclNlcXVlbmNlID0gXCJcIjtcblx0Y29uc3QgcXVlcnlBcnJheTogc3RyaW5nW10gPSBbXTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBxdWVyeS5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChxdWVyeVtpXSA9PT0gXCIgXCIpIGNvbnRpbnVlO1xuXHRcdGN1cnJlbnRDaGFyYWN0ZXJTZXF1ZW5jZSArPSBxdWVyeVtpXTtcblx0XHRpZiAoY3VycmVudENoYXJhY3RlclNlcXVlbmNlLmxlbmd0aCA9PT0gMikge1xuXHRcdFx0cXVlcnlBcnJheS5wdXNoKGN1cnJlbnRDaGFyYWN0ZXJTZXF1ZW5jZSk7XG5cdFx0XHRjdXJyZW50Q2hhcmFjdGVyU2VxdWVuY2UgPSBcIlwiO1xuXHRcdH1cblx0fVxuXHRpZiAoY3VycmVudENoYXJhY3RlclNlcXVlbmNlLmxlbmd0aCA+IDApIHtcblx0XHRxdWVyeUFycmF5LnB1c2goXCIwXCIgKyBjdXJyZW50Q2hhcmFjdGVyU2VxdWVuY2UpO1xuXHR9XG5cdHJldHVybiBxdWVyeUFycmF5O1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBHaXZlbiB0d28gc29ydGVkIGNvbGxlY3Rpb25zIG9mIG51bWJlcnMsIHJldHVybnMgdGhlIHVuaW9uXG4gKiBiZXR3ZWVuIHRoZW0gKE9SKS5cbiAqIEBwYXJhbSB7bnVtYmVyW119IG9uZSBUaGUgZmlyc3Qgc29ydGVkIGFycmF5IG9mIG51bWJlcnNcbiAqIEBwYXJhbSB7bnVtYmVyW119IG90aGVyIFRoZSBvdGhlciBzb3J0ZWQgYXJyYXkgb2YgbnVtYmVyc1xuICogQHJldHVybnMge251bWJlcltdfSBBIHNvcnRlZCBjb2xsZWN0aW9ucyBvZiBudW1iZXJzIHJlcHJlc2VudGluZyB0aGUgdW5pb24gKE9SKVxuICogYmV0d2VlbiB0byBzb3J0ZWQgY29sbGVjdGlvbnMgb2YgbnVtYmVyc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzanVuY3Rpb24ob25lOiBudW1iZXJbXSwgb3RoZXI6IG51bWJlcltdKTogbnVtYmVyW10ge1xuXHRjb25zdCByZXN1bHQ6IG51bWJlcltdID0gW107XG5cdGxldCBpID0gMCwgaiA9IDA7XG5cblx0d2hpbGUgKGkgPCBvbmUubGVuZ3RoIHx8IGogPCBvdGhlci5sZW5ndGgpIHtcblx0XHRpZiAoaSA+PSBvbmUubGVuZ3RoKSB7XG5cdFx0XHRyZXN1bHQucHVzaChvdGhlcltqKytdKTtcblx0XHR9IGVsc2UgaWYgKGogPj0gb3RoZXIubGVuZ3RoKSB7XG5cdFx0XHRyZXN1bHQucHVzaChvbmVbaSsrXSk7XG5cdFx0fSBlbHNlIGlmIChvbmVbaV0gPT09IG90aGVyW2pdKSB7XG5cdFx0XHRyZXN1bHQucHVzaChvbmVbaV0pO1xuXHRcdFx0aSsrO1xuXHRcdFx0aisrO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fSBlbHNlIGlmIChvbmVbaV0gPCBvdGhlcltqXSkge1xuXHRcdFx0cmVzdWx0LnB1c2gob25lW2krK10pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXN1bHQucHVzaChvdGhlcltqKytdKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBHaXZlbiB0d28gc29ydGVkIGNvbGxlY3Rpb25zIG9mIG51bWJlcnMsIHJldHVybnMgdGhlIHJlbGF0aXZlXG4gKiBjb21wbGVtZW50IGJldHdlZW4gdGhlbSAoWE9SKS5cbiAqIEBwYXJhbSB7bnVtYmVyW119IG9uZSBUaGUgZmlyc3Qgc29ydGVkIGFycmF5IG9mIG51bWJlcnNcbiAqIEBwYXJhbSB7bnVtYmVyW119IG90aGVyIFRoZSBvdGhlciBzb3J0ZWQgYXJyYXkgb2YgbnVtYmVyc1xuICogQHJldHVybnMge251bWJlcltdfSBBIHNvcnRlZCBjb2xsZWN0aW9ucyBvZiBudW1iZXJzIHJlcHJlc2VudGluZyB0aGUgY29tcGxlbWVudCAoWE9SKVxuICogYmV0d2VlbiB0byBzb3J0ZWQgY29sbGVjdGlvbnMgb2YgbnVtYmVyc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVsYXRpdmVDb21wbGVtZW50KG9uZTogbnVtYmVyW10sIG90aGVyOiBudW1iZXJbXSk6IG51bWJlcltdIHtcblx0Y29uc3QgcmVzdWx0OiBudW1iZXJbXSA9IFtdO1xuXHRsZXQgaSA9IDAsIGogPSAwO1xuXG5cdHdoaWxlIChpIDwgb25lLmxlbmd0aCB8fCBqIDwgb3RoZXIubGVuZ3RoKSB7XG5cdFx0aWYgKGkgPj0gb25lLmxlbmd0aCkge1xuXHRcdFx0cmVzdWx0LnB1c2gob3RoZXJbaisrXSk7XG5cdFx0fSBlbHNlIGlmIChqID49IG90aGVyLmxlbmd0aCkge1xuXHRcdFx0cmVzdWx0LnB1c2gob25lW2krK10pO1xuXHRcdH0gZWxzZSBpZiAob25lW2ldID09PSBvdGhlcltqXSkge1xuXHRcdFx0aSsrO1xuXHRcdFx0aisrO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fSBlbHNlIGlmIChvbmVbaV0gPCBvdGhlcltqXSkge1xuXHRcdFx0cmVzdWx0LnB1c2gob25lW2krK10pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXN1bHQucHVzaChvdGhlcltqKytdKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBTZWFyY2hlcyBhIGtleSBlbGVtZW50IGluc2lkZSBhIHNvcnRlZCBhcnJheS5cbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1RbXX0gYXJyYXkgVGhlIHNvcnRlZCBhcnJheSB0byBzZWFyY2ggaW5cbiAqIEBwYXJhbSB7VH0ga2V5IFRoZSBrZXkgdG8gc2VhcmNoIGZvciBpbiB0aGUgc29ydGVkIGFycmF5XG4gKiBAcGFyYW0ge2NvbXBhcmF0b3JDYWxsYmFja30gY29tcGFyYXRvciBUaGUgY29tcGFyYXRvciBjYWxsYmFja1xuICogQHJldHVybnMge251bWJlcn0gVGhlIGF0IHdoaWNoIGEgZ2l2ZW4gZWxlbWVudCBjYW4gYmUgZm91bmQgaW4gdGhlIGFycmF5LCBvciBhIG5lZ2F0aXZlIHZhbHVlIGlmIGl0IGlzIG5vdCBwcmVzZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5hcnlTZWFyY2g8VD4oYXJyYXk6IFJlYWRvbmx5QXJyYXk8VD4sIGtleTogVCwgY29tcGFyYXRvcjogKG9wMTogVCwgb3AyOiBUKSA9PiBudW1iZXIpOiBudW1iZXIge1xuXHRsZXQgbG93ID0gMCxcblx0XHRoaWdoID0gYXJyYXkubGVuZ3RoIC0gMTtcblxuXHR3aGlsZSAobG93IDw9IGhpZ2gpIHtcblx0XHRjb25zdCBtaWQgPSAoKGxvdyArIGhpZ2gpIC8gMikgfCAwO1xuXHRcdGNvbnN0IGNvbXAgPSBjb21wYXJhdG9yKGFycmF5W21pZF0sIGtleSk7XG5cdFx0aWYgKGNvbXAgPCAwKSB7XG5cdFx0XHRsb3cgPSBtaWQgKyAxO1xuXHRcdH0gZWxzZSBpZiAoY29tcCA+IDApIHtcblx0XHRcdGhpZ2ggPSBtaWQgLSAxO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbWlkO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gLShsb3cgKyAxKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgZ2V0RWxlbWVudHNHaXZlbk1vdXNlRXZlbnQgfSBmcm9tIFwiLi91dGlsXCI7XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIFRvZ2dsZXMgdGhlIGhvdmVyIG9uIGEgY2VsbFxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBUaGUgZXZlbnQgd2hpY2ggaXMgaGFuZGVkIHRvIGEgbW91c2UgZXZlbnQgbGlzdGVuZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUhvdmVyKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG5cdGNvbnN0IGVsZW1lbnRzID0gZ2V0RWxlbWVudHNHaXZlbk1vdXNlRXZlbnQoZXZlbnQpO1xuXHRpZiAoZWxlbWVudHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cdGVsZW1lbnRzWzBdLmNsYXNzTGlzdC50b2dnbGUoXCJob3ZlclwiKTtcblx0ZWxlbWVudHNbMV0uY2xhc3NMaXN0LnRvZ2dsZShcImhvdmVyXCIpO1xufSIsICIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgdnNjb2RlIH0gZnJvbSBcIi4vaGV4RWRpdFwiO1xuXG4vKipcbiAqIFNpbXBsZSBzdGF0aWMgY2xhc3Mgd2hpY2ggaGFuZGxlcyBzZXR0aW5nIGFuZCBjbGVhcmluZyB0aGUgd2Vidmlld3Mgc3RhdGVcbiAqIFdlIHVzZSB0aGlzIG92ZXIgdGhlIGRlZmF1bHQgLnNldFN0YXRlIGFzIGl0IGltcGxlbWVudHMgYSBzZXRTdGF0ZSB3aGljaCBkb2Vzbid0IG92ZXJyaWRlIHRoZSBlbnRpcmUgb2JqZWN0IGp1c3QgdGhlIGdpdmVuIHByb3BlcnR5XG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJ2aWV3U3RhdGVNYW5hZ2VyIHtcblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEdpdmVuIGEgcHJvcGVydHkgYW5kIGEgdmFsdWUgZWl0aGVyIHVwZGF0ZXMgb3IgYWRkcyBpdCB0byB0aGUgc3RhdGVcblx0ICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5TmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHlcblx0ICogQHBhcmFtIHthbnl9IHByb3BlcnR5VmFsdWUgVGhlIHZhbHVlIHRvIHN0b3JlIGZvciB0aGUgcHJvcGVydHlcblx0ICovXG5cdHN0YXRpYyBzZXRQcm9wZXJ0eShwcm9wZXJ0eU5hbWU6IHN0cmluZywgcHJvcGVydHlWYWx1ZTogYW55KTogdm9pZCB7XG5cdFx0bGV0IGN1cnJlbnRTdGF0ZSA9IFdlYnZpZXdTdGF0ZU1hbmFnZXIuZ2V0U3RhdGUoKTtcblx0XHRpZiAoY3VycmVudFN0YXRlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGN1cnJlbnRTdGF0ZSA9IHt9O1xuXHRcdH1cblx0XHRjdXJyZW50U3RhdGVbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5VmFsdWU7XG5cdFx0dnNjb2RlLnNldFN0YXRlKGN1cnJlbnRTdGF0ZSk7XG5cdH1cblxuXHQvKioqXG5cdCAqIEBkZXNjcmlwdGlvbiBDbGVhcnMgdGhlIHN0YXRlIG9iamVjdFxuXHQgKi9cblx0c3RhdGljIGNsZWFyU3RhdGUoKTogdm9pZCB7XG5cdFx0dnNjb2RlLnNldFN0YXRlKCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJldHJpZXZlcyB0aGUgc3RhdGUgb2JqZWN0XG5cdCAqL1xuXHRzdGF0aWMgZ2V0U3RhdGUoKTogYW55IHtcblx0XHRyZXR1cm4gdHlwZW9mIHZzY29kZS5nZXRTdGF0ZSgpID09PSBcInN0cmluZ1wiID8gSlNPTi5wYXJzZSh2c2NvZGUuZ2V0U3RhdGUoKSkgOiB2c2NvZGUuZ2V0U3RhdGUoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gU2V0cyB0aGUgc3RhdGUgb2YgdGhlIHdlYnZpZXcgdG8gd2hhdGV2ZXIgb2JqZWN0IGlzIHBhc3NlZCBpbiwgY29tcGxldGVseSBvdmVycmlkaW5nIGl0XG5cdCAqIEBwYXJhbSBzdGF0ZSBUaGUgc3RhdGUgb2JqZWN0XG5cdCAqL1xuXHRzdGF0aWMgc2V0U3RhdGUoc3RhdGU6IGFueSk6IHZvaWQge1xuXHRcdHZzY29kZS5zZXRTdGF0ZShzdGF0ZSk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJldHJpZXZlcyBhIHByb3BlcnR5IG9uIHRoZSBzdGF0ZSBvYmplY3Rcblx0ICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5TmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gcmV0cmlldmUgdGhlIHZhbHVlIG9mXG5cdCAqL1xuXHRzdGF0aWMgZ2V0UHJvcGVydHkocHJvcGVydHlOYW1lOiBzdHJpbmcpOiBhbnkge1xuXHRcdGNvbnN0IHN0YXRlID0gV2Vidmlld1N0YXRlTWFuYWdlci5nZXRTdGF0ZSgpO1xuXHRcdHJldHVybiBzdGF0ZVtwcm9wZXJ0eU5hbWVdO1xuXHR9XG59IiwgIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG5cbmltcG9ydCB7IHZpcnR1YWxIZXhEb2N1bWVudCB9IGZyb20gXCIuL2hleEVkaXRcIjtcbmltcG9ydCB7IGlzTWFjIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHsgV2Vidmlld1N0YXRlTWFuYWdlciB9IGZyb20gXCIuL3dlYnZpZXdTdGF0ZU1hbmFnZXJcIjtcblxuZXhwb3J0IGNsYXNzIFNjcm9sbEJhckhhbmRsZXIge1xuXHRwcml2YXRlIHNjcm9sbEJhcjogSFRNTERpdkVsZW1lbnQ7XG5cdHByaXZhdGUgc2Nyb2xsQmFySGVpZ2h0ITogbnVtYmVyO1xuXHRwcml2YXRlIHNjcm9sbFRodW1iOiBIVE1MRGl2RWxlbWVudDtcblx0cHJpdmF0ZSBzY3JvbGxUaHVtYkhlaWdodCE6IG51bWJlcjtcblx0cHJpdmF0ZSBzY3JvbGxKdW1wITogbnVtYmVyO1xuXHRwcml2YXRlIHJvd0hlaWdodDogbnVtYmVyO1xuXHRwcml2YXRlIHNjcm9sbFRvcDogbnVtYmVyO1xuXHRwcml2YXRlIGlzRHJhZ2dpbmc6IGJvb2xlYW47XG5cdC8qKlxuXHQgKiBHaXZlbiBhIHNjcm9sbGJhciBlbGVtZW50IGluc3RhbnRpYXRlcyBhIGhhbmRsZXIgd2hpY2ggaGFuZGxlcyB0aGUgc2Nyb2xsaW5nIGJlaGF2aW9yIGluIHRoZSBlZGl0b3Jcblx0ICogQHBhcmFtIHtzdHJpbmd9IHNjcm9sbEJhcklkIHRoZSBpZCBvZiB0aGUgc2Nyb2xsYmFyIGVsZW1lbnQgb24gdGhlIERPTVxuXHQgKiBAcGFyYW0ge251bWJlcn0gcm93SGVpZ2h0IHRoZSBoZWlnaHQgb2YgYSByb3cgaW4gcHhcblx0ICovXG5cdGNvbnN0cnVjdG9yKHNjcm9sbEJhcklkOiBzdHJpbmcsIG51bVJvd3M6IG51bWJlciwgcm93SGVpZ2h0OiBudW1iZXIpIHtcblx0XHR0aGlzLnNjcm9sbFRvcCA9IDA7XG5cdFx0dGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG5cdFx0Ly8gSWYgdGhlIHNjcm9sbGJhciBpc24ndCBvbiB0aGUgRE9NIGZvciBzb21lIHJlYXNvbiB0aGVyZSdzIG5vdGhpbmcgd2UgY2FuIGRvIGJlc2lkZXMgY3JlYXRlIGFuIGVtcHR5IGhhbmRsZXIgYW5kIHRocm93IGFuIGVycm9yXG5cdFx0aWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNjcm9sbEJhcklkKSkge1xuXHRcdFx0dGhpcy5zY3JvbGxCYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzY3JvbGxCYXJJZCkhIGFzIEhUTUxEaXZFbGVtZW50O1xuXHRcdFx0dGhpcy5zY3JvbGxUaHVtYiA9IHRoaXMuc2Nyb2xsQmFyLmNoaWxkcmVuWzBdIGFzIEhUTUxEaXZFbGVtZW50O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnNjcm9sbEJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHR0aGlzLnNjcm9sbFRodW1iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdHRocm93IFwiSW52YWxpZCBzY3JvbGxiYXIgaWQhXCI7XG5cdFx0fVxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgdGhpcy5vbk1vdXNlV2hlZWwuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5zY3JvbGxCYXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoKSA9PiB7XG5cdFx0XHR0aGlzLnNjcm9sbFRodW1iLmNsYXNzTGlzdC5hZGQoXCJzY3JvbGxpbmdcIik7XG5cdFx0XHR0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuXHRcdH0pO1xuXHRcdHRoaXMuc2Nyb2xsQmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsICgpID0+IHtcblx0XHRcdHRoaXMuc2Nyb2xsVGh1bWIuY2xhc3NMaXN0LnJlbW92ZShcInNjcm9sbGluZ1wiKTtcblx0XHRcdHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuXHRcdH0pO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMuc2Nyb2xsVGh1bWJEcmFnLmJpbmQodGhpcykpO1xuXHRcdHRoaXMucm93SGVpZ2h0ID0gcm93SGVpZ2h0O1xuXHRcdHRoaXMudXBkYXRlU2Nyb2xsQmFyKG51bVJvd3MpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIGVuc3VyaW5nIHRoZSBzY3JvbGxiYXIgaXMgdmFsaWQgYWZ0ZXIgd2luZG93IHJlc2l6ZVxuXHQgKiBAcGFyYW0ge251bWJlcn0gbnVtUm93cyBUaGUgbnVtYmVyIG9mIHJvd3MgaW4gdGhlIGZpbGUsIG5lZWRlZCB0byBtYXAgc2Nyb2xsIGJhciB0byByb3cgbG9jYXRpb25zXG5cdCAqL1xuXHRwdWJsaWMgdXBkYXRlU2Nyb2xsQmFyKG51bVJvd3M6IG51bWJlcik6IHZvaWQge1xuXHRcdC8vIFNvbWUgY2FsY3VsYXRpb25zIHNvIHRoYXQgdGhlIHRodW1iIC8gc2NydWJiZXIgaXMgcmVwcmVzZW50YXRpdmUgb2YgaG93IG11Y2ggY29udGVudCB0aGVyZSBpc1xuXHRcdC8vIENyZWRpdCB0byBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNjM2Njc5NS9ob3ctdG8tY2FsY3VsYXRlLXRoZS1zaXplLW9mLXNjcm9sbC1iYXItdGh1bWIgZm9yIHRoZXNlIGNhbGN1bGF0aW9uc1xuXHRcdGNvbnN0IGNvbnRlbnRIZWlnaHQgPSAobnVtUm93cyArIDEpICogdGhpcy5yb3dIZWlnaHQ7XG5cdFx0dGhpcy5zY3JvbGxCYXJIZWlnaHQgPSB0aGlzLnNjcm9sbEJhci5jbGllbnRIZWlnaHQ7XG5cdFx0Ly8gV2UgZG9uJ3Qgd2FudCB0aGUgc2Nyb2xsIHRodW1iIGxhcmdlciB0aGFuIHRoZSBzY3JvbGxiYXJcblx0XHR0aGlzLnNjcm9sbFRodW1iSGVpZ2h0ID0gTWF0aC5taW4odGhpcy5zY3JvbGxCYXJIZWlnaHQsIE1hdGgubWF4KHRoaXMuc2Nyb2xsQmFySGVpZ2h0ICogKHRoaXMuc2Nyb2xsQmFySGVpZ2h0IC8gY29udGVudEhlaWdodCksIDMwKSk7XG5cdFx0dGhpcy5zY3JvbGxUaHVtYi5zdHlsZS5oZWlnaHQgPSBgJHt0aGlzLnNjcm9sbFRodW1iSGVpZ2h0fXB4YDtcblx0XHQvLyBJZiB5b3UgbW92ZSB0aGUgc2Nyb2xsYmFyIDFweCBob3cgbXVjaCBzaG91bGQgdGhlIGRvY3VtZW50IG1vdmVcblx0XHR0aGlzLnNjcm9sbEp1bXAgPSBNYXRoLm1heCgwLCAoY29udGVudEhlaWdodCAtIHRoaXMuc2Nyb2xsQmFySGVpZ2h0KSAvICh0aGlzLnNjcm9sbEJhckhlaWdodCAtIHRoaXMuc2Nyb2xsVGh1bWJIZWlnaHQpKTtcblx0XHR0aGlzLnVwZGF0ZVNjcm9sbGVkUG9zaXRpb24oKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB3aGVuIHRoZSB1c2VyIGRyYWdzIHRoZSB0aHVtYiBvbiB0aGUgc2Nyb2xsYmFyIGFyb3VuZFxuXHQgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFRoZSBtb3VzZSBldmVudCBwYXNzZWQgdG8gdGhlIGV2ZW50IGhhbmRsZXJcblx0ICovXG5cdHByaXZhdGUgc2Nyb2xsVGh1bWJEcmFnKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG5cdFx0Ly8gaWYgdGhlc2UgYXJlIGVxdWFsIGl0IG1lYW5zIHRoZSBkb2N1bWVudCBpcyB0b28gc2hvcnQgdG8gc2Nyb2xsIGFueXdheXNcblx0XHRpZiAodGhpcy5zY3JvbGxCYXJIZWlnaHQgPT09IHRoaXMuc2Nyb2xsVGh1bWJIZWlnaHQpIHJldHVybjtcblx0XHQvLyBUaGlzIGhlbHBzIHRoZSBjYXNlIHdoZXJlIHdlIGxvc2UgdHJhY2sgYXMgdGhlIHVzZXIgcmVsZWFzZXMgdGhlIGJ1dHRvbiBvdXRzaWRlIHRoZSB3ZWJ2aWV3XG5cdFx0aWYgKCF0aGlzLmlzRHJhZ2dpbmcgfHwgZXZlbnQuYnV0dG9ucyA9PSAwKSB7XG5cdFx0XHR0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcblx0XHRcdHRoaXMuc2Nyb2xsVGh1bWIuY2xhc3NMaXN0LnJlbW92ZShcInNjcm9sbGluZ1wiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLnVwZGF0ZVZpcnR1YWxTY3JvbGxUb3AoZXZlbnQuY2xpZW50WSAqIHRoaXMuc2Nyb2xsSnVtcCk7XG5cdFx0dGhpcy51cGRhdGVTY3JvbGxlZFBvc2l0aW9uKCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFVwZGFlcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRvY3VtZW50IGFuZCB0aGUgc2Nyb2xsYmFyIHRodW1iIGJhc2VkIG9uIHRoZSBzY3JvbGxUb3Bcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlU2Nyb2xsZWRQb3NpdGlvbigpOiBQcm9taXNlPHZvaWRbXT4ge1xuXHRcdC8vIFRoZSB2aXJ0dWFsIGRvY3VtZW50IHVwb24gZmlyc3QgbG9hZCBpcyB1bmRlZmluZWQgc28gd2Ugd2FudCB0byBwcmV2ZW50IGFueSBlcnJvcnMgYW5kIGp1c3Qgbm90IGRvIGFueXRoaW5nIGluIHRoYXQgY2FzZVxuXHRcdGlmICghdmlydHVhbEhleERvY3VtZW50IHx8ICF2aXJ0dWFsSGV4RG9jdW1lbnQuZG9jdW1lbnRIZWlnaHQpIHJldHVybiBbXTtcblx0XHR0aGlzLnNjcm9sbFRodW1iLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVZKCR7dGhpcy5zY3JvbGxUb3AgLyB0aGlzLnNjcm9sbEp1bXB9cHgpYDtcblx0XHQvLyBUaGlzIG1ha2VzIHN1cmUgaXQgZG9lc24ndCBzY3JvbGwgcGFzdCB0aGUgYm90dG9tIG9mIHRoZSB2aWV3cG9ydFxuXHRcdChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwicm93d3JhcHBlclwiKVswXSBhcyBIVE1MRWxlbWVudCkhLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVZKC0ke3RoaXMuc2Nyb2xsVG9wICUgdmlydHVhbEhleERvY3VtZW50LmRvY3VtZW50SGVpZ2h0fXB4KWA7XG5cdFx0KGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJyb3d3cmFwcGVyXCIpWzFdIGFzIEhUTUxFbGVtZW50KSEuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVkoLSR7dGhpcy5zY3JvbGxUb3AgJSB2aXJ0dWFsSGV4RG9jdW1lbnQuZG9jdW1lbnRIZWlnaHR9cHgpYDtcblx0XHQoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInJvd3dyYXBwZXJcIilbMl0gYXMgSFRNTEVsZW1lbnQpIS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlWSgtJHt0aGlzLnNjcm9sbFRvcCAlIHZpcnR1YWxIZXhEb2N1bWVudC5kb2N1bWVudEhlaWdodH1weClgO1xuXHRcdHJldHVybiB2aXJ0dWFsSGV4RG9jdW1lbnQuc2Nyb2xsSGFuZGxlcigpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSB1c2VyIHNjcm9sbGluZyB3aXRoIHRoZWlyIG1vdXNlIHdoZWVsXG5cdCAqIEBwYXJhbSB7V2hlZWxFdmVudH0gZXZlbnQgVGhlIGV2ZW50IGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNjcm9sbCBwYXNzZWQgdG8gdGhlIGV2ZW50IGhhbmRsZXJcblx0ICovXG5cdHByaXZhdGUgb25Nb3VzZVdoZWVsKGV2ZW50OiBXaGVlbEV2ZW50KTogdm9pZCB7XG5cdFx0Ly8gaWYgdGhlc2UgYXJlIGVxdWFsIGl0IG1lYW5zIHRoZSBkb2N1bWVudCBpcyB0b28gc2hvcnQgdG8gc2Nyb2xsIGFueXdheXNcblx0XHRpZiAodGhpcy5zY3JvbGxCYXJIZWlnaHQgPT09IHRoaXMuc2Nyb2xsVGh1bWJIZWlnaHQpIHJldHVybjtcblx0XHRpZiAoZXZlbnQuZGVsdGFZID09PSAwIHx8IGV2ZW50LnNoaWZ0S2V5KSByZXR1cm47XG5cdFx0Ly8gSEFDSzogSWYgb24gbWFjIGFuZCB0aGUgZGVsdGFZIGlzIG5vdCAxMjAgKHR5cGljYWwgbW91c2Ugd2hlZWwgdmFsdWUpLCB0cmVhdCBpdCBhcyBhXG5cdFx0Ly8gdG91Y2ggc2Nyb2xsLiBUaGlzIGlzbid0IHBlcmZlY3QgYW5kIHdvbid0IHdvcmsgb24gV2luZG93cyBidXQgdW5ibG9ja3MgZ29vZCBzY3JvbGxpbmcgb25cblx0XHQvLyBtYWNPUy5cblx0XHRpZiAoaXNNYWMgJiYgTWF0aC5hYnMoZXZlbnQuZGVsdGFZKSAhPT0gMTIwKSB7XG5cdFx0XHRzd2l0Y2ggKGV2ZW50LmRlbHRhTW9kZSkge1xuXHRcdFx0XHRjYXNlIFdoZWVsRXZlbnQuRE9NX0RFTFRBX0xJTkU6XG5cdFx0XHRcdFx0aWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlVmlydHVhbFNjcm9sbFRvcCh0aGlzLnNjcm9sbFRvcCArIHRoaXMucm93SGVpZ2h0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVWaXJ0dWFsU2Nyb2xsVG9wKHRoaXMuc2Nyb2xsVG9wIC0gdGhpcy5yb3dIZWlnaHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBXaGVlbEV2ZW50LkRPTV9ERUxUQV9QSVhFTDpcblx0XHRcdFx0ZGVmYXVsdDogLy8gRmFsbGJhY2sgdG8gcGl4ZWxcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZVZpcnR1YWxTY3JvbGxUb3AodGhpcy5zY3JvbGxUb3AgKyBldmVudC5kZWx0YVkpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBTY3JvbGwgMSBsaW5lIGF0IGEgdGltZSB3aGVuIHVzaW5nIGEgbW91c2Vcblx0XHRcdGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlVmlydHVhbFNjcm9sbFRvcCh0aGlzLnNjcm9sbFRvcCArIHRoaXMucm93SGVpZ2h0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlVmlydHVhbFNjcm9sbFRvcCh0aGlzLnNjcm9sbFRvcCAtIHRoaXMucm93SGVpZ2h0KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLnVwZGF0ZVNjcm9sbGVkUG9zaXRpb24oKTtcblx0fVxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIENhbiBiZSBjYWxsZWQgdG8gc2Nyb2xsIHRoZSBkb2N1bWVudCBzaW1pbGFyIHRvIHdpbmRvdy5zY3JvbGxCeVxuXHQgKiBAcGFyYW0ge251bWJlcn0gbnVtUm93cyBUaGUgbnVtYmVyIG9mIHJvd3MgeW91IHdhbnQgdG8gc2Nyb2xsXG5cdCAqIEBwYXJhbSB7XCJ1cFwiIHwgXCJkb3duXCJ9IGRpcmVjdGlvbiBUaGUgZGlyZWN0aW9uLCB1cCBvciBkb3duXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgc2Nyb2xsRG9jdW1lbnQobnVtUm93czogbnVtYmVyLCBkaXJlY3Rpb246IFwidXBcIiB8IFwiZG93blwiKTogUHJvbWlzZTx2b2lkW10+IHtcblx0XHRpZiAoZGlyZWN0aW9uID09PSBcInVwXCIpIHtcblx0XHRcdHRoaXMudXBkYXRlVmlydHVhbFNjcm9sbFRvcCh0aGlzLnNjcm9sbFRvcCAtICh0aGlzLnJvd0hlaWdodCAqIG51bVJvd3MpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy51cGRhdGVWaXJ0dWFsU2Nyb2xsVG9wKHRoaXMuc2Nyb2xsVG9wICsgKHRoaXMucm93SGVpZ2h0ICogbnVtUm93cykpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy51cGRhdGVTY3JvbGxlZFBvc2l0aW9uKCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFNjcm9sbHMgdG8gdGhlIHRvcCBvZiB0aGUgZG9jdW1lbnRcblx0ICovXG5cdHB1YmxpYyBzY3JvbGxUb1RvcCgpOiB2b2lkIHtcblx0XHR0aGlzLnVwZGF0ZVZpcnR1YWxTY3JvbGxUb3AoMCk7XG5cdFx0dGhpcy51cGRhdGVTY3JvbGxlZFBvc2l0aW9uKCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFNjcm9sbHMgdG8gdGhlIGJvdHRvbSBvZiB0aGUgZG9jdW1lbnRcblx0ICovXG5cdHB1YmxpYyBzY3JvbGxUb0JvdHRvbSgpOiB2b2lkIHtcblx0XHR0aGlzLnVwZGF0ZVZpcnR1YWxTY3JvbGxUb3AoKCh0aGlzLnNjcm9sbEJhckhlaWdodCAtIHRoaXMuc2Nyb2xsVGh1bWJIZWlnaHQpICogdGhpcy5zY3JvbGxKdW1wKSArIHRoaXMucm93SGVpZ2h0KTtcblx0XHR0aGlzLnVwZGF0ZVNjcm9sbGVkUG9zaXRpb24oKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gQ29udHJvbHMgc2Nyb2xsaW5nIHVwIGFuZCBkb3duIG9uZSB2aWV3cG9ydC4gV2hpY2ggb2NjdXJzIHdoZW4gdGhlIHVzZXIgcHJlc3NlcyBwYWdlIHVwIG9yIHBhZ2UgZG93blxuXHQgKiBAcGFyYW0ge251bWJlcn0gdmlld3BvcnRIZWlnaHQgVGhlIGhlaWdodCBvZiB0aGUgdmlld3BvcnQgaW4gcGl4ZWxzXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gV2hldGhlciB5b3Ugd2FudCB0byBwYWdlIHVwIG9yIGRvd25cblx0ICovXG5cdHB1YmxpYyBwYWdlKHZpZXdwb3J0SGVpZ2h0OiBudW1iZXIsIGRpcmVjdGlvbjogXCJ1cFwiIHwgXCJkb3duXCIpOiB2b2lkIHtcblx0XHRpZiAoZGlyZWN0aW9uID09IFwidXBcIikge1xuXHRcdFx0dGhpcy51cGRhdGVWaXJ0dWFsU2Nyb2xsVG9wKHRoaXMuc2Nyb2xsVG9wIC0gdmlld3BvcnRIZWlnaHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnVwZGF0ZVZpcnR1YWxTY3JvbGxUb3AodGhpcy5zY3JvbGxUb3AgKyB2aWV3cG9ydEhlaWdodCk7XG5cdFx0fVxuXHRcdHRoaXMudXBkYXRlU2Nyb2xsZWRQb3NpdGlvbigpO1xuXHR9XG5cblx0LyoqKlxuXHQgKiBAZGVzY3JpcHRpb24gU2V0cyB0aGUgdmlydHVhbFNjcm9sbFRvcCBlbnN1cmluZyBpdCBuZXZlciBleGNlZWRzIHRoZSBkb2N1bWVudCBib3VuZHNcblx0ICogQHBhcmFtIHtudW1iZXJ9IG5ld1Njcm9sbFRvcCBUaGUgbnVtYmVyIHlvdSdyZSB0cnlpbmcgdG8gc2V0IHRoZSB2aXJ0dWFsIHNjcm9sbCB0b3AgdG9cblx0ICovXG5cdHByaXZhdGUgdXBkYXRlVmlydHVhbFNjcm9sbFRvcChuZXdTY3JvbGxUb3A6IG51bWJlcik6IHZvaWQge1xuXHRcdHRoaXMuc2Nyb2xsVG9wID0gTWF0aC5tYXgoMCwgbmV3U2Nyb2xsVG9wKTtcblx0XHRuZXdTY3JvbGxUb3AgPSB0aGlzLnNjcm9sbFRvcDtcblx0XHR0aGlzLnNjcm9sbFRvcCA9IE1hdGgubWluKG5ld1Njcm9sbFRvcCwgKCh0aGlzLnNjcm9sbEJhckhlaWdodCAtIHRoaXMuc2Nyb2xsVGh1bWJIZWlnaHQpICogdGhpcy5zY3JvbGxKdW1wKSArIHRoaXMucm93SGVpZ2h0KTtcblx0XHRXZWJ2aWV3U3RhdGVNYW5hZ2VyLnNldFByb3BlcnR5KFwic2Nyb2xsX3RvcFwiLCB0aGlzLnNjcm9sbFRvcCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJldHJpZXZlcyB0aGUgcGl4ZWwgdmFsdWUgYXQgdGhlIHRvcCBvZiB0aGUgdmlld3BvcnRcblx0ICogQHJldHVybnMge251bWJlcn0gVGhlIHBpeGVsIHZhbHVlIG9mIHRoZSB2aXJ0dWFsIHZpZXdwb3J0IHRvcFxuXHQgKi9cblx0cHVibGljIGdldCB2aXJ0dWFsU2Nyb2xsVG9wKCk6IG51bWJlciB7XG5cdFx0cmV0dXJuIHRoaXMuc2Nyb2xsVG9wO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBVcGRhdGVzIHRoZSBzY3JvbGwgcG9zaXRpb24gdG8gYmUgd2hhdGV2ZXIgd2FzIHNhdmVkIGluIHRoZSB3ZWJ2aWV3IHN0YXRlLiBTaG91bGQgb25seSBiZSBjYWxsZWQgaWYgdGhlIHVzZXIgaGFzIHJlbG9hZGVkIHRoZSB3ZWJ2aWV3XG5cdCAqL1xuXHRwdWJsaWMgcmVzeW5jU2Nyb2xsUG9zaXRpb24oKTogdm9pZCB7XG5cdFx0Ly8gSWYgd2UgaGFkIGEgcHJldmlvdXNseSBzYXZlZCBzdGF0ZSB3aGVuIGNyZWF0aW5nIHRoZSBzY3JvbGxiYXIgd2Ugc2hvdWxkIHJlc3RvcmUgdGhlIHNjcm9sbCBwb3NpdGlvblxuXHRcdGlmIChXZWJ2aWV3U3RhdGVNYW5hZ2VyLmdldFN0YXRlKCkgJiYgV2Vidmlld1N0YXRlTWFuYWdlci5nZXRTdGF0ZSgpLnNjcm9sbF90b3ApIHtcblx0XHRcdHRoaXMudXBkYXRlVmlydHVhbFNjcm9sbFRvcChXZWJ2aWV3U3RhdGVNYW5hZ2VyLmdldFN0YXRlKCkuc2Nyb2xsX3RvcCk7XG5cdFx0XHR0aGlzLnVwZGF0ZVNjcm9sbGVkUG9zaXRpb24oKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFNjcm9sbHMgdG8gdGhlIGdpdmVuIG9mZnNldCBpZiBpdCdzIG91dHNpZGUgdGhlIHZpZXdwb3J0XG5cdCAqIEBwYXJhbSBvZmZzZXQgVGhlIG9mZnNldCB0byBzY3JvbGwgdG9cblx0ICogQHBhcmFtIGZvcmNlIFdoZXRoZXIgb3Igbm90IHlvdSBzaG91bGQgc2Nyb2xsIGV2ZW4gaWYgaXQncyBpbiB0aGUgdmlld3BvcnRcblx0ICovXG5cdHB1YmxpYyBhc3luYyBzY3JvbGxUb09mZnNldChvZmZzZXQ6IG51bWJlciwgZm9yY2U/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkW10+IHtcblx0XHQvLyBpZiB0aGVzZSBhcmUgZXF1YWwgaXQgbWVhbnMgdGhlIGRvY3VtZW50IGlzIHRvbyBzaG9ydCB0byBzY3JvbGwgYW55d2F5c1xuXHRcdGlmICh0aGlzLnNjcm9sbEJhckhlaWdodCA9PT0gdGhpcy5zY3JvbGxUaHVtYkhlaWdodCkgcmV0dXJuIFtdO1xuXHRcdGNvbnN0IHRvcE9mZnNldCA9IHZpcnR1YWxIZXhEb2N1bWVudC50b3BPZmZzZXQoKTtcblx0XHQvLyBEb24ndCBzY3JvbGwgaWYgaW4gdGhlIHZpZXdwb3J0XG5cdFx0aWYgKCFmb3JjZSAmJiBvZmZzZXQgPj0gdG9wT2Zmc2V0ICYmIG9mZnNldCA8PSB2aXJ0dWFsSGV4RG9jdW1lbnQuYm90dG9tT2Zmc2V0KCkpIHJldHVybiBbXTtcblx0XHRjb25zdCByb3dEaWZmZXJlbmNlID0gTWF0aC5mbG9vcihNYXRoLmFicyhvZmZzZXQgLSB0b3BPZmZzZXQpIC8gMTYpO1xuXHRcdC8vIFRoZSArMy8tMyBpcyBiZWNhdXNlIHRoZXJlIGlzIGJlY2F1c2Ugd2Ugd2FudCB0aGUgcmVzdWx0IHRvIG5vdCBiZSBwcmVzc2VkIGFnYWluc3QgdGhlIHRvcFxuXHRcdGlmIChvZmZzZXQgPiB0b3BPZmZzZXQpIHtcblx0XHRcdHJldHVybiB0aGlzLnNjcm9sbERvY3VtZW50KHJvd0RpZmZlcmVuY2UgLSAzLCBcImRvd25cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLnNjcm9sbERvY3VtZW50KHJvd0RpZmZlcmVuY2UgKyAzLCBcInVwXCIpO1xuXHRcdH1cblx0fVxufSIsICIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgZ2V0RWxlbWVudHNXaXRoR2l2ZW5PZmZzZXQsIHJlbGF0aXZlQ29tcGxlbWVudCwgYmluYXJ5U2VhcmNoLCBkaXNqdW5jdGlvbiB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCB7IFdlYnZpZXdTdGF0ZU1hbmFnZXIgfSBmcm9tIFwiLi93ZWJ2aWV3U3RhdGVNYW5hZ2VyXCI7XG5cbmV4cG9ydCBjbGFzcyBTZWxlY3RIYW5kbGVyIHtcblx0cHJpdmF0ZSBfZm9jdXM6IG51bWJlciB8IHVuZGVmaW5lZDtcblx0cHJpdmF0ZSBfc2VsZWN0aW9uOiBudW1iZXJbXSA9IFtdO1xuXHRwcml2YXRlIF9zZWxlY3Rpb25TdGFydDogbnVtYmVyIHwgdW5kZWZpbmVkO1xuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gR2l2ZW4gYW4gb2Zmc2V0IHNlbGVjdHMgdGhlIGVsZW1lbnRzLiBUaGlzIGRvZXMgbm90IGNsZWFyIHRoZSBwcmV2aW91c2x5IHNlbGVjdGVkIGVsZW1lbnRzLlxuXHQgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IE9mZnNldCB0byBzZWxlY3Rcblx0ICogQHBhcmFtIHtib29sZWFufSBmb3JjZSBJZiBmb3JjZSBpcyBub3QgZ2l2ZW4sIHRvZ2dsZXMgc2VsZWN0aW9uLiBJZiBmb3JjZSBpcyB0cnVlIHNlbGVjdHMgdGhlIGVsZW1lbnQuXG5cdCAqIElmIGZvcmNlIGlzIGZhbHNlIGRlc2VsZWN0cyB0aGUgZWxlbWVudC5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIHRvZ2dsZVNlbGVjdE9mZnNldChvZmZzZXQ6IG51bWJlciwgZm9yY2U/OiBib29sZWFuKTogdm9pZCB7XG5cdFx0Y29uc3QgZWxlbWVudHMgPSBnZXRFbGVtZW50c1dpdGhHaXZlbk9mZnNldChvZmZzZXQpO1xuXHRcdGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApIHtcblx0XHRcdC8vIEVsZW1lbnQgbWF5IG5vdCBiZSBwYXJ0IG9mIHRoZSBET01cblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZWxlbWVudHNbMF0uY2xhc3NMaXN0LnRvZ2dsZShcInNlbGVjdGVkXCIsIGZvcmNlKTtcblx0XHRlbGVtZW50c1sxXS5jbGFzc0xpc3QudG9nZ2xlKFwic2VsZWN0ZWRcIiwgZm9yY2UpO1xuXHR9XG5cblx0LyoqKlxuXHQgKiBAZGVzY3JpcHRpb24gUmV0dXJucyB0aGUgb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGN1cnJlbnRseSBmb2N1c2VkLlxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGN1cnJlbnRseSBmb2N1c2VkXG5cdCAqL1xuXHRwdWJsaWMgZ2V0Rm9jdXNlZCgpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuXHRcdHJldHVybiB0aGlzLl9mb2N1cztcblx0fVxuXG5cdC8qKipcblx0ICogQGRlc2NyaXB0aW9uIFNldCB0aGUgb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGN1cnJlbnRseSBmb2N1c2VkLlxuXHQgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IFRoZSBvZmZzZXQgdGhlIGVsZW1lbnQgY3VycmVudGx5IGZvY3VzZWRcblx0ICovXG5cdHB1YmxpYyBzZXRGb2N1c2VkKG9mZnNldDogbnVtYmVyIHwgdW5kZWZpbmVkKTogdm9pZCB7XG5cdFx0dGhpcy5fZm9jdXMgPSBvZmZzZXQ7XG5cdH1cblxuXHQvKioqXG5cdCAqIEBkZXNjcmlwdGlvbiBSZXR1cm5zIHRoZSBvZmZzZXQgZnJvbSB3aGljaCB0aGUgc2VsZWN0aW9uIHN0YXJ0cy5cblx0ICogQHJldHVybnMge251bWJlcn0gVGhlIG9mZnNldCBmcm9tIHdoaWNoIHRoZSBzZWxlY3Rpb24gc3RhcnRzXG5cdCAqL1xuXHRwdWJsaWMgZ2V0U2VsZWN0aW9uU3RhcnQoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcblx0XHRyZXR1cm4gdGhpcy5fc2VsZWN0aW9uU3RhcnQgPz8gdGhpcy5fZm9jdXM7XG5cdH1cblxuXHQvKioqXG5cdCAqIEBkZXNjcmlwdGlvbiBSZXR1cm5zIHRoZSBvZmZzZXRzIG9mIHRoZSBlbGVtZW50cyBjdXJyZW50bHkgc2VsZWN0ZWQuXG5cdCAqIEByZXR1cm5zIHtudW1iZXJbXX0gVGhlIG9mZnNldHMgb2YgdGhlIGVsZW1lbnRzIGN1cnJlbnRseSBzZWxlY3RlZFxuXHQgKi9cblx0cHVibGljIGdldFNlbGVjdGVkKCk6IG51bWJlcltdIHtcblx0XHRyZXR1cm4gV2Vidmlld1N0YXRlTWFuYWdlci5nZXRQcm9wZXJ0eShcInNlbGVjdGVkX29mZnNldHNcIikgPz8gW107XG5cdH1cblxuXHQvKioqXG5cdCAqIEBkZXNjcmlwdGlvbiBHaXZlbiBhbiBhcnJheSBvZiBvZmZzZXRzLCBzZWxlY3RzIHRoZSBjb3JyZXNwb25kaW5nIGVsZW1lbnRzLlxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBvZmZzZXRzIFRoZSBvZmZzZXRzIG9mIHRoZSBlbGVtZW50cyB5b3Ugd2FudCB0byBzZWxlY3Rcblx0ICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFRoZSBvZmZzZXQgZnJvbSB3aGljaCB0aGUgc2VsZWN0aW9uIHN0YXJ0c1xuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlUmVuZGVyIFdoZXRlciB0byBmb3JjZSByZW5kZXJpbmcgb2YgYWxsIGVsZW1lbnRzIHdob3NlXG5cdCAqIHNlbGVjdGVkIHN0YXRlZCB3aWxsIGNoYW5nZVxuXHQgKi9cblx0cHVibGljIHNldFNlbGVjdGVkKG9mZnNldHM6IG51bWJlcltdLCBmb3JjZVJlbmRlciA9IGZhbHNlKTogdm9pZCB7XG5cdFx0Y29uc3Qgb2xkU2VsZWN0aW9uID0gdGhpcy5fc2VsZWN0aW9uO1xuXG5cdFx0dGhpcy5fc2VsZWN0aW9uID0gWy4uLm9mZnNldHNdLnNvcnQoKGE6IG51bWJlciwgYjogbnVtYmVyKSA9PiBhIC0gYik7XG5cdFx0dGhpcy5fc2VsZWN0aW9uU3RhcnQgPSB0aGlzLl9zZWxlY3Rpb25bMF07XG5cdFx0V2Vidmlld1N0YXRlTWFuYWdlci5zZXRQcm9wZXJ0eShcInNlbGVjdGVkX29mZnNldHNcIiwgdGhpcy5fc2VsZWN0aW9uKTtcblxuXHRcdC8vIE5lZWQgdG8gY2FsbCByZW5kZXJTZWxlY3Rpb24gd2l0aCB0aGUgbGVhc3QgbnVtYmVyIG9mIG9mZnNldHMgdG8gYXZvaWQgcXVlcnlpbmcgdGhlIERPTVxuXHRcdC8vIGFzIG11Y2ggYXMgcG9zc2libGUsIGlmIG5vdCByZW5kZXJpbmcgbGFyZ2Ugc2VsZWN0aW9ucyBiZWNvbWVzIGxhZ2d5IGFzIHdlIGRvbnQgaG9sZCByZWZlcmVuY2VzXG5cdFx0Ly8gdG8gdGhlIERPTSBlbGVtZW50c1xuXHRcdGNvbnN0IHRvUmVuZGVyID0gZm9yY2VSZW5kZXIgPyBkaXNqdW5jdGlvbihvbGRTZWxlY3Rpb24sIHRoaXMuX3NlbGVjdGlvbikgOiByZWxhdGl2ZUNvbXBsZW1lbnQob2xkU2VsZWN0aW9uLCB0aGlzLl9zZWxlY3Rpb24pO1xuXHRcdHRoaXMucmVuZGVyU2VsZWN0aW9uKHRvUmVuZGVyKTtcblx0fVxuXG5cdC8qKipcblx0ICogQGRlc2NyaXB0aW9uIFJldHVybnMgdGhlIG9mZnNldCBvZiB0aGUgYW5jaG9yIGNlbGwgdGhhdCBpcyB1c2VkIGZvclxuXHQgKiBleHBhbmRpbmcgdGhlIHNlbGVjdGlvbiB1c2luZyBTaGlmdCtDbGljay5cblx0ICogQHJldHVybnMge251bWJlcn0gVGhlIG9mZnNldCBvZiB0aGUgYW5jaG9yIGNlbGxcblx0ICovXG5cdHB1YmxpYyBnZXRBbmNob3IoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcblx0XHRyZXR1cm4gV2Vidmlld1N0YXRlTWFuYWdlci5nZXRQcm9wZXJ0eShcInNlbGVjdGlvbl9hbmNob3JcIik7XG5cdH1cblxuXHQvKioqXG5cdCAqIEBkZXNjcmlwdGlvbiBTZXQgdGhlIG9mZnNldCBvZiB0aGUgYW5jaG9yIGNlbGwgdGhhdCBpcyB1c2VkIGZvciBleHBhbmRpbmdcblx0ICogdGhlIHNlbGVjdGlvbiB1c2luZyBTaGlmdCtDbGljay5cblx0ICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBUaGUgb2Zmc2V0IG9mIHRoZSBhbmNob3IgY2VsbFxuXHQgKi9cblx0cHVibGljIHNldEFuY2hvcihvZmZzZXQ6IG51bWJlcik6IHZvaWQge1xuXHRcdFdlYnZpZXdTdGF0ZU1hbmFnZXIuc2V0UHJvcGVydHkoXCJzZWxlY3Rpb25fYW5jaG9yXCIsIG9mZnNldCk7XG5cdH1cblxuXHQvKioqXG5cdCAqIEBkZXNjcmlwdGlvbiBSZW5kZXJzIHRoZSB1cGRhdGVkIHNlbGVjdGlvbiBzdGF0ZSBvZiBzZWxlY3RlZC91bnNlbGVjdGVkIGVsZW1lbnRzXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IG9mZnNldHMgVGhlIG9mZnNldHMgb2YgdGhlIGVsZW1lbnRzIHRvIHJlbmRlclxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJTZWxlY3Rpb24ob2Zmc2V0czogbnVtYmVyW10pOiB2b2lkIHtcblx0XHRjb25zdCBjb250YWlucyA9IChvZmZzZXQ6IG51bWJlcik6IGJvb2xlYW4gPT4gYmluYXJ5U2VhcmNoKHRoaXMuX3NlbGVjdGlvbiwgb2Zmc2V0LCAoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IGEgLSBiKSA+PSAwO1xuXG5cdFx0Zm9yIChjb25zdCBvZmZzZXQgb2Ygb2Zmc2V0cykge1xuXHRcdFx0U2VsZWN0SGFuZGxlci50b2dnbGVTZWxlY3RPZmZzZXQob2Zmc2V0LCBjb250YWlucyhvZmZzZXQpKTtcblx0XHR9XG5cdH1cblxuXHQvKioqXG5cdCAqIEBkZXNjcmlwdGlvbiBHcmFicyB0aGUgaGV4IHZhbHVlcyBvZiB0aGUgc2VsZWN0ZWQgYnl0ZXNcblx0ICogQHJldHVybnMge3N0cmluZ1tdfSBUaGUgaGV4IHZhbHVlc1xuXHQgKi9cblx0cHVibGljIHN0YXRpYyBnZXRTZWxlY3RlZEhleCgpOiBzdHJpbmdbXSB7XG5cdFx0Y29uc3QgaGV4OiBzdHJpbmdbXSA9IFtdO1xuXHRcdGNvbnN0IHNlbGVjdGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInNlbGVjdGVkIGhleFwiKSBhcyBIVE1MQ29sbGVjdGlvbk9mPEhUTUxTcGFuRWxlbWVudD47XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RlZC5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKHNlbGVjdGVkW2ldLmlubmVyVGV4dCA9PT0gXCIrXCIpIGNvbnRpbnVlO1xuXHRcdFx0aGV4LnB1c2goc2VsZWN0ZWRbaV0uaW5uZXJUZXh0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGhleDtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gRm9jdXNlcyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgY3VycmVudCBzZWxlY3Rpb24gYmFzZWQgb24gdGhlIHNlY3Rpb24gcGFzc2VkIGluXG5cdCAqIEBwYXJhbSBzZWN0aW9uIHtcImhleFwiIHwgXCJhc2NpaVwifSBUaGUgc2VjdGlvbiB0byBwbGFjZSB0aGUgZm9jdXNcblx0ICovXG5cdHB1YmxpYyBzdGF0aWMgZm9jdXNTZWxlY3Rpb24oc2VjdGlvbjogXCJoZXhcIiB8IFwiYXNjaWlcIik6IHZvaWQge1xuXHRcdGNvbnN0IHNlbGVjdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoYHNlbGVjdGVkICR7c2VjdGlvbn1gKTtcblx0XHRpZiAoc2VsZWN0aW9uLmxlbmd0aCAhPT0gMCkgKHNlbGVjdGlvblswXSBhcyBIVE1MU3BhbkVsZW1lbnQpLmZvY3VzKCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJldHJpZXZlcyB0aGUgc2VsZWN0aW9uIGFzIGEgc3RyaW5nLCBkZWZhdWx0cyB0byBoZXggaWYgdGhlcmUgaXMgbm8gZm9jdXMgb24gZWl0aGVyIHNpZGVcblx0ICogQHJldHVybnMge3N0cmluZ30gVGhlIHNlbGVjdGlvbiByZXByZXNlbnRlZCBhcyBhIHN0cmluZ1xuXHQgKi9cblx0cHVibGljIHN0YXRpYyBnZXRTZWxlY3RlZFZhbHVlKCk6IHN0cmluZyB7XG5cdFx0bGV0IHNlbGVjdGVkVmFsdWUgPSBcIlwiO1xuXHRcdGxldCBzZWN0aW9uID0gXCJoZXhcIjtcblx0XHRsZXQgc2VsZWN0ZWRFbGVtZW50czogSFRNTENvbGxlY3Rpb25PZjxIVE1MU3BhbkVsZW1lbnQ+O1xuXHRcdGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50Py5jbGFzc0xpc3QuY29udGFpbnMoXCJhc2NpaVwiKSkge1xuXHRcdFx0c2VjdGlvbiA9IFwiYXNjaWlcIjtcblx0XHRcdHNlbGVjdGVkRWxlbWVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwic2VsZWN0ZWQgYXNjaWlcIikgYXMgSFRNTENvbGxlY3Rpb25PZjxIVE1MU3BhbkVsZW1lbnQ+O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxlY3RlZEVsZW1lbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInNlbGVjdGVkIGhleFwiKSBhcyBIVE1MQ29sbGVjdGlvbk9mPEhUTUxTcGFuRWxlbWVudD47XG5cdFx0fVxuXHRcdGZvciAoY29uc3QgZWxlbWVudCBvZiBzZWxlY3RlZEVsZW1lbnRzKSB7XG5cdFx0XHRpZiAoZWxlbWVudC5pbm5lclRleHQgPT09IFwiK1wiKSBjb250aW51ZTtcblx0XHRcdHNlbGVjdGVkVmFsdWUgKz0gZWxlbWVudC5pbm5lclRleHQ7XG5cdFx0XHRpZiAoc2VjdGlvbiA9PT0gXCJoZXhcIikgc2VsZWN0ZWRWYWx1ZSArPSBcIiBcIjtcblx0XHR9XG5cdFx0Ly8gSWYgaXQncyBoZXggd2Ugd2FudCB0byByZW1vdmUgdGhlIGxhc3Qgc3BhY2UgYXMgaXQgZG9lc24ndCBtYWtlIHNlbnNlXG5cdFx0Ly8gRm9yIGFzY2lpIHRoYXQgc3BhY2UgbWlnaHQgaGF2ZSBtZWFuaW5nXG5cdFx0aWYgKHNlY3Rpb24gPT09IFwiaGV4XCIpIHNlbGVjdGVkVmFsdWUgPSBzZWxlY3RlZFZhbHVlLnRyaW1SaWdodCgpO1xuXHRcdHJldHVybiBzZWxlY3RlZFZhbHVlO1xuXHR9XG59XG4iLCAiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IGdldEVsZW1lbnRzV2l0aEdpdmVuT2Zmc2V0LCB1cGRhdGVBc2NpaVZhbHVlLCBnZXRFbGVtZW50c09mZnNldCB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCB7IEJ5dGVEYXRhIH0gZnJvbSBcIi4vYnl0ZURhdGFcIjtcbmltcG9ydCB7IG1lc3NhZ2VIYW5kbGVyLCB2aXJ0dWFsSGV4RG9jdW1lbnQgfSBmcm9tIFwiLi9oZXhFZGl0XCI7XG5pbXBvcnQgeyBTZWxlY3RIYW5kbGVyIH0gZnJvbSBcIi4vc2VsZWN0SGFuZGxlclwiO1xuXG5pbnRlcmZhY2UgRG9jdW1lbnRFZGl0IHtcblx0b2Zmc2V0OiBudW1iZXI7XG5cdHByZXZpb3VzVmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcblx0bmV3VmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcblx0ZWxlbWVudDogSFRNTFNwYW5FbGVtZW50IHwgdW5kZWZpbmVkO1xufVxuXG4vLyBUaGlzIGlzIHdoYXQgYW4gZWRpdCB0by9mcm9tIHRoZSBleHRlbnNpb24gaG9zdCBsb29rcyBsaWtlXG5leHBvcnQgaW50ZXJmYWNlIEVkaXRNZXNzYWdlIHtcblx0cmVhZG9ubHkgb2xkVmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZDtcblx0cmVhZG9ubHkgbmV3VmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZDtcblx0cmVhZG9ubHkgb2Zmc2V0OiBudW1iZXI7XG5cdHJlYWRvbmx5IHNhbWVPbkRpc2s6IGJvb2xlYW47XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIENsYXNzIHJlc3BvbnNpYmxlIGZvciBoYW5kbGluZyBlZGl0cyB3aXRoaW4gdGhlIHZpcnR1YWwgZG9jdW1lbnRcbiAqL1xuZXhwb3J0IGNsYXNzIEVkaXRIYW5kbGVyIHtcblx0cHJpdmF0ZSBwZW5kaW5nRWRpdDogRG9jdW1lbnRFZGl0IHwgdW5kZWZpbmVkO1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMucGVuZGluZ0VkaXQgPSB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgd2hlbiBhIHVzZXIgc3RhcnRzIHR5cGluZyBvbiBhIGhleCBlbGVtZW50XG5cdCAqIEBwYXJhbSB7SFRNTFNwYW5FbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHdoaWNoIHRoZSBrZXlwcmVzcyB3YXMgZmlyZWQgb25cblx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVByZXNzZWQgVGhlIGtleSB3aGljaCB3YXMgcHJlc3NlZFxuXHQgKi9cblx0cHVibGljIGFzeW5jIGVkaXRIZXgoZWxlbWVudDogSFRNTFNwYW5FbGVtZW50LCBrZXlQcmVzc2VkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBJZiB0aGUgdXNlciBwcmVzc2VzIGVzY2FwZSBhbmQgdGhlcmUgaXMgYSBjdXJyZW50IGVkaXQgdGhlbiB3ZSBqdXN0IHJldmVydCB0aGUgY2VsbCBhcyBpZiBubyBlZGl0IGhhcyBoYXBwZW5lZFxuXHRcdGlmIChrZXlQcmVzc2VkID09PSBcIkVzY2FwZVwiICYmIHRoaXMucGVuZGluZ0VkaXQgJiYgdGhpcy5wZW5kaW5nRWRpdC5wcmV2aW91c1ZhbHVlKSB7XG5cdFx0XHRlbGVtZW50LmlubmVyVGV4dCA9IHRoaXMucGVuZGluZ0VkaXQucHJldmlvdXNWYWx1ZTtcblx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImVkaXRpbmdcIik7XG5cdFx0XHR0aGlzLnBlbmRpbmdFZGl0ID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHQvLyBJZiBpdCdzIG5vdCBhIHZhbGlkIGhleCBpbnB1dCBvciBkZWxldGUgd2UgaWdub3JlIGl0XG5cdFx0Y29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKC9eW2EtZkEtRjAtOV0kL2dtKTtcblx0XHRpZiAoa2V5UHJlc3NlZC5tYXRjaChyZWdleCkgPT09IG51bGwgJiYga2V5UHJlc3NlZCAhPT0gXCJEZWxldGVcIikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9mZnNldDogbnVtYmVyID0gZ2V0RWxlbWVudHNPZmZzZXQoZWxlbWVudCk7XG5cdFx0aWYgKCF0aGlzLnBlbmRpbmdFZGl0IHx8IHRoaXMucGVuZGluZ0VkaXQub2Zmc2V0ICE9IG9mZnNldCkge1xuXHRcdFx0dGhpcy5wZW5kaW5nRWRpdCA9IHtcblx0XHRcdFx0b2Zmc2V0OiBvZmZzZXQsXG5cdFx0XHRcdHByZXZpb3VzVmFsdWU6IGVsZW1lbnQuaW5uZXJUZXh0ID09PSBcIitcIiA/IHVuZGVmaW5lZCA6IGVsZW1lbnQuaW5uZXJUZXh0LFxuXHRcdFx0XHRuZXdWYWx1ZTogXCJcIixcblx0XHRcdFx0ZWxlbWVudDogZWxlbWVudFxuXHRcdFx0fTtcblx0XHR9XG5cdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZWRpdGluZ1wiKTtcblx0XHRlbGVtZW50LmlubmVyVGV4dCA9IGVsZW1lbnQuaW5uZXJUZXh0LnRyaW1SaWdodCgpO1xuXHRcdC8vIFdoZW4gdGhlIHVzZXIgaGl0cyBkZWxldGVcblx0XHRpZiAoa2V5UHJlc3NlZCA9PT0gXCJEZWxldGVcIikge1xuXHRcdFx0ZWxlbWVudC5pbm5lclRleHQgPSBcIiAgXCI7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFRoaXMgaGFuZGxlcyB3aGVuIHRoZSB1c2VyIHByZXNzZXMgdGhlIGZpcnN0IGNoYXJhY3RlciBlcmFzaW5nIHRoZSBvbGQgdmFsdWUgdnMgYWRkaW5nIHRvIHRoZSBjdXJyZW50bHkgZWRpdGVkIHZhbHVlXG5cdFx0XHRlbGVtZW50LmlubmVyVGV4dCA9IGVsZW1lbnQuaW5uZXJUZXh0Lmxlbmd0aCAhPT0gMSB8fCBlbGVtZW50LmlubmVyVGV4dCA9PT0gXCIrXCIgPyBgJHtrZXlQcmVzc2VkLnRvVXBwZXJDYXNlKCl9IGAgOiBlbGVtZW50LmlubmVyVGV4dCArIGtleVByZXNzZWQudG9VcHBlckNhc2UoKTtcblx0XHR9XG5cblx0XHR0aGlzLnBlbmRpbmdFZGl0Lm5ld1ZhbHVlID0gZWxlbWVudC5pbm5lclRleHQ7XG5cdFx0aWYgKGVsZW1lbnQuaW5uZXJUZXh0LnRyaW1SaWdodCgpLmxlbmd0aCA9PSAyKSB7XG5cdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJhZGQtY2VsbFwiKTtcblx0XHRcdC8vIE5vdCByZWFsbHkgYW4gZWRpdCBpZiBub3RoaW5nIGNoYW5nZWRcblx0XHRcdGlmICh0aGlzLnBlbmRpbmdFZGl0Lm5ld1ZhbHVlID09IHRoaXMucGVuZGluZ0VkaXQucHJldmlvdXNWYWx1ZSkge1xuXHRcdFx0XHR0aGlzLnBlbmRpbmdFZGl0ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRhd2FpdCB0aGlzLnNlbmRFZGl0VG9FeHRIb3N0KFt0aGlzLnBlbmRpbmdFZGl0XSk7XG5cdFx0XHR0aGlzLnVwZGF0ZUFzY2lpKGVsZW1lbnQuaW5uZXJUZXh0LCBvZmZzZXQpO1xuXHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZWRpdGVkXCIpO1xuXHRcdFx0Ly8gTWVhbnMgdGhlIGxhc3QgY2VsbCBvZiB0aGUgZG9jdW1lbnQgd2FzIGZpbGxlZCBpbiBzbyB3ZSBhZGQgYW5vdGhlciBwbGFjZWhvbGRlciBhZnRlcndhcmRzXG5cdFx0XHRpZiAoIXRoaXMucGVuZGluZ0VkaXQucHJldmlvdXNWYWx1ZSkge1xuXHRcdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQuY3JlYXRlQWRkQ2VsbCgpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5wZW5kaW5nRWRpdCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgd2hlbiB0aGUgdXNlciBzdGFydHMgdHlwaW5nIG9uIGFuIGFzY2lpIGVsZW1lbnRcblx0ICogQHBhcmFtIHtIVE1MU3BhbkVsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgd2hpY2ggdGhlIGtleXN0cm9rZSB3YXMgZmlyZWQgb25cblx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVByZXNzZWQgVGhlIGtleSB3aGljaCB3YXMgcHJlc3NlZFxuXHQgKi9cblx0cHVibGljIGFzeW5jIGVkaXRBc2NpaShlbGVtZW50OiBIVE1MU3BhbkVsZW1lbnQsIGtleVByZXNzZWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIFdlIGRvbid0IHdhbnQgdG8gZG8gYW55dGhpbmcgaWYgdGhlIHVzZXIgcHJlc3NlcyBhIGtleSBzdWNoIGFzIGhvbWUgZXRjIHdoaWNoIHdpbGwgcmVnaXN0ZXIgYXMgZ3JlYXRlciB0aGFuIDEgY2hhclxuXHRcdGlmIChrZXlQcmVzc2VkLmxlbmd0aCAhPSAxKSByZXR1cm47XG5cdFx0Y29uc3Qgb2Zmc2V0OiBudW1iZXIgPSBnZXRFbGVtZW50c09mZnNldChlbGVtZW50KTtcblx0XHRjb25zdCBoZXhFbGVtZW50ID0gZ2V0RWxlbWVudHNXaXRoR2l2ZW5PZmZzZXQob2Zmc2V0KVswXTtcblx0XHRjb25zdCBuZXdWYWx1ZUhleCA9IGtleVByZXNzZWQuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcblx0XHQvLyBObyBuZWVkIHRvIGNhbGwgaXQgZWRpdGVkIGlmIGl0J3MgdGhlIHNhbWUgdmFsdWUuIFRoZSBjb21wYXJpc29uIGlzIGRvbmUgb24gaGV4IHZhbHVlcyBiZWNhdXNlICcrJyBhbmQgJy4nIGhhdmUgYWRkaXRpb25hbCBtZWFuaW5nIG9uIEFTQ0lJIHBhbmVsXG5cdFx0aWYoaGV4RWxlbWVudC5pbm5lclRleHQgPT09IG5ld1ZhbHVlSGV4KXtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly8gV2Ugc3RvcmUgYWxsIHBlbmRpbmcgZWRpdHMgYXMgaGV4IGFzIGFzY2lpIGlzbid0IGFsd2F5cyByZXByZXNlbnRhdGl2ZSBkdWUgdG8gY29udHJvbCBjaGFyYWN0ZXJzXG5cdFx0dGhpcy5wZW5kaW5nRWRpdCA9IHtcblx0XHRcdG9mZnNldDogb2Zmc2V0LFxuXHRcdFx0cHJldmlvdXNWYWx1ZTogaGV4RWxlbWVudC5pbm5lclRleHQgPT09IFwiK1wiID8gdW5kZWZpbmVkIDogaGV4RWxlbWVudC5pbm5lclRleHQsXG5cdFx0XHRuZXdWYWx1ZTogbmV3VmFsdWVIZXgsXG5cdFx0XHRlbGVtZW50OiBlbGVtZW50XG5cdFx0fTtcblx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJhZGQtY2VsbFwiKTtcblx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJlZGl0aW5nXCIpO1xuXHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImVkaXRlZFwiKTtcblx0XHR0aGlzLnVwZGF0ZUFzY2lpKHRoaXMucGVuZGluZ0VkaXQubmV3VmFsdWUsIG9mZnNldCk7XG5cdFx0dGhpcy51cGRhdGVIZXgoa2V5UHJlc3NlZCwgb2Zmc2V0KTtcblx0XHRhd2FpdCB0aGlzLnNlbmRFZGl0VG9FeHRIb3N0KFt0aGlzLnBlbmRpbmdFZGl0XSk7XG5cdFx0Ly8gTWVhbnMgdGhlIGxhc3QgY2VsbCBvZiB0aGUgZG9jdW1lbnQgd2FzIGZpbGxlZCBpbiBzbyB3ZSBhZGQgYW5vdGhlciBwbGFjZWhvbGRlciBhZnRlcndhcmRzXG5cdFx0aWYgKCF0aGlzLnBlbmRpbmdFZGl0LnByZXZpb3VzVmFsdWUpIHtcblx0XHRcdHZpcnR1YWxIZXhEb2N1bWVudC5jcmVhdGVBZGRDZWxsKCk7XG5cdFx0fVxuXHRcdHRoaXMucGVuZGluZ0VkaXQgPSB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEdpdmVuIGEgaGV4IHZhbHVlIHVwZGF0ZXMgdGhlIHJlc3BlY3RpdmUgYXNjaWkgdmFsdWVcblx0ICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGhleFZhbHVlIFRoZSBoZXggdmFsdWUgdG8gY29udmVydCB0byBhc2NpaVxuXHQgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IFRoZSBvZmZzZXQgb2YgdGhlIGFzY2lpIHZhbHVlIHRvIHVwZGF0ZVxuXHQgKi9cblx0cHJpdmF0ZSB1cGRhdGVBc2NpaShoZXhWYWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBvZmZzZXQ6IG51bWJlcik6IHZvaWQge1xuXHRcdC8vIEZvciBub3cgaWYgaXQncyB1bmRlZmluZWQgd2Ugd2lsbCBqdXN0IGlnbm9yZSBpdCwgYnV0IHRoaXMgd291bGQgYmUgdGhlIGRlbGV0ZSBjYXNlXG5cdFx0aWYgKCFoZXhWYWx1ZSkgcmV0dXJuO1xuXHRcdC8vIFRoZSB3YXkgdGhlIERPTSBpcyBjb25zdHJ1Y3RlZCB0aGUgYXNjaWkgZWxlbWVudCB3aWxsIGFsd2F5cyBiZSB0aGUgc2Vjb25kIG9uZVxuXHRcdGNvbnN0IGFzY2lpID0gZ2V0RWxlbWVudHNXaXRoR2l2ZW5PZmZzZXQob2Zmc2V0KVsxXTtcblx0XHRhc2NpaS5jbGFzc0xpc3QucmVtb3ZlKFwiYWRkLWNlbGxcIik7XG5cdFx0dXBkYXRlQXNjaWlWYWx1ZShuZXcgQnl0ZURhdGEocGFyc2VJbnQoaGV4VmFsdWUsIDE2KSksIGFzY2lpKTtcblx0XHRhc2NpaS5jbGFzc0xpc3QuYWRkKFwiZWRpdGVkXCIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBHaXZlbiBhbiBhc2NpaSB2YWx1ZSB1cGRhdGVzIHRoZSByZXNwZWN0aXZlIGhleCB2YWx1ZVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gYXNjaWlWYWx1ZSBUaGUgYXNjaWkgdmFsdWUgdG8gY29udmVydCB0byBoZXhcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBUaGUgb2Zmc2V0IG9mIHRoZSBoZXggdmFsdWUgdG8gdXBkYXRlXG5cdCAqL1xuXHRwcml2YXRlIHVwZGF0ZUhleChhc2NpaVZhbHVlOiBzdHJpbmcsIG9mZnNldDogbnVtYmVyKTogdm9pZCB7XG5cdFx0Ly8gVGhlIHdheSB0aGUgRE9NIGlzIGNvbnN0cnVjdGVkIHRoZSBoZXggZWxlbWVudCB3aWxsIGFsd2F5cyBiZSB0aGUgZmlyc3Qgb25lXG5cdFx0Y29uc3QgaGV4ID0gZ2V0RWxlbWVudHNXaXRoR2l2ZW5PZmZzZXQob2Zmc2V0KVswXTtcblx0XHRoZXguaW5uZXJUZXh0ID0gYXNjaWlWYWx1ZS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuXHRcdGhleC5jbGFzc0xpc3QucmVtb3ZlKFwiYWRkLWNlbGxcIik7XG5cdFx0aGV4LmNsYXNzTGlzdC5hZGQoXCJlZGl0ZWRcIik7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIENvbXBsZXRlcyB0aGUgY3VycmVudCBlZGl0LCB0aGlzIGlzIHVzZWQgaWYgdGhlIHVzZXIgbmF2aWdhdGVzIG9mZiB0aGUgY2VsbCBhbmQgaXQgd2Fzbid0IGRvbmUgYmVpbmcgZWRpdGVkXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgY29tcGxldGVQZW5kaW5nRWRpdHMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKHRoaXMucGVuZGluZ0VkaXQgJiYgdGhpcy5wZW5kaW5nRWRpdC5lbGVtZW50ICYmIHRoaXMucGVuZGluZ0VkaXQubmV3VmFsdWUpIHtcblx0XHRcdC8vIFdlIGRvbid0IHdhbnQgdG8gc3RvcCB0aGUgZWRpdCBpZiBpdCBpcyBzZWxlY3RlZCBhcyB0aGF0IGNhbiBtZWFuIHRoZSB1c2VyIHdpbGwgYmUgbWFraW5nIGZ1cnRoZXIgZWRpdHNcblx0XHRcdGlmICh0aGlzLnBlbmRpbmdFZGl0LmVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwic2VsZWN0ZWRcIikpIHJldHVybjtcblx0XHRcdC8vIEVuc3VyZSB0aGUgaGV4IHZhbHVlIGhhcyAyIGNoYXJhY3RlcnMsIGlmIG5vdCB3ZSBhZGQgYSAwIGluIGZyb250XG5cdFx0XHR0aGlzLnBlbmRpbmdFZGl0Lm5ld1ZhbHVlID0gXCIwMFwiICsgdGhpcy5wZW5kaW5nRWRpdC5uZXdWYWx1ZS50cmltUmlnaHQoKTtcblx0XHRcdHRoaXMucGVuZGluZ0VkaXQubmV3VmFsdWUgPSB0aGlzLnBlbmRpbmdFZGl0Lm5ld1ZhbHVlLnNsaWNlKHRoaXMucGVuZGluZ0VkaXQubmV3VmFsdWUubGVuZ3RoIC0gMik7XG5cdFx0XHR0aGlzLnBlbmRpbmdFZGl0LmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImVkaXRpbmdcIik7XG5cdFx0XHR0aGlzLnBlbmRpbmdFZGl0LmVsZW1lbnQuaW5uZXJUZXh0ID0gdGhpcy5wZW5kaW5nRWRpdC5uZXdWYWx1ZTtcblx0XHRcdC8vIE5vIGVkaXQgcmVhbGx5IGhhcHBlbmVkIHNvIHdlIGRvbid0IHdhbnQgaXQgdG8gdXBkYXRlIHRoZSBleHQgaG9zdFxuXHRcdFx0aWYgKHRoaXMucGVuZGluZ0VkaXQubmV3VmFsdWUgPT09IHRoaXMucGVuZGluZ0VkaXQucHJldmlvdXNWYWx1ZSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnVwZGF0ZUFzY2lpKHRoaXMucGVuZGluZ0VkaXQubmV3VmFsdWUsIHRoaXMucGVuZGluZ0VkaXQub2Zmc2V0KTtcblx0XHRcdHRoaXMucGVuZGluZ0VkaXQuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZWRpdGVkXCIpO1xuXHRcdFx0dGhpcy5wZW5kaW5nRWRpdC5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJhZGQtY2VsbFwiKTtcblx0XHRcdGF3YWl0IHRoaXMuc2VuZEVkaXRUb0V4dEhvc3QoW3RoaXMucGVuZGluZ0VkaXRdKTtcblx0XHRcdGlmICghdGhpcy5wZW5kaW5nRWRpdC5wcmV2aW91c1ZhbHVlKSB7XG5cdFx0XHRcdHZpcnR1YWxIZXhEb2N1bWVudC5jcmVhdGVBZGRDZWxsKCk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnBlbmRpbmdFZGl0ID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gR2l2ZW4gYSBsaXN0IG9mIGVkaXRzIHNlbmRzIGl0IHRvIHRoZSBleHRob3N0IHNvIHRoYXQgdGhlIGV4dCBob3N0IGFuZCB3ZWJ2aWV3IGFyZSBpbiBzeW5jXG5cdCAqIEBwYXJhbSB7RG9jdW1lbnRFZGl0fSBlZGl0cyBUaGUgZWRpdHMgdG8gc2VuZCB0byB0aGUgZXh0aG9zdFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBzZW5kRWRpdFRvRXh0SG9zdChlZGl0czogRG9jdW1lbnRFZGl0W10pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBleHRIb3N0TWVzc2FnZTogRWRpdE1lc3NhZ2VbXSA9IFtdO1xuXHRcdGZvciAoY29uc3QgZWRpdCBvZiBlZGl0cykge1xuXHRcdFx0Ly8gVGhlIGV4dCBob3N0IG9ubHkgYWNjZXB0cyA4Yml0IHVuc2lnbmVkIGludHMsIHNvIHdlIG11c3QgY29udmVydCB0aGUgZWRpdHMgYmFjayBpbnRvIHRoYXQgcmVwcmVzZW50YXRpb25cblx0XHRcdGNvbnN0IG9sZFZhbHVlID0gZWRpdC5wcmV2aW91c1ZhbHVlID8gcGFyc2VJbnQoZWRpdC5wcmV2aW91c1ZhbHVlLCAxNikgOiB1bmRlZmluZWQ7XG5cdFx0XHRjb25zdCBuZXdWYWx1ZSA9IGVkaXQubmV3VmFsdWUgPyBwYXJzZUludChlZGl0Lm5ld1ZhbHVlLCAxNikgOiB1bmRlZmluZWQ7XG5cdFx0XHRjb25zdCBjdXJyZW50TWVzc2FnZSA9IHtcblx0XHRcdFx0b2Zmc2V0OiBlZGl0Lm9mZnNldCxcblx0XHRcdFx0b2xkVmFsdWUsXG5cdFx0XHRcdG5ld1ZhbHVlLFxuXHRcdFx0XHRzYW1lT25EaXNrOiBmYWxzZVxuXHRcdFx0fTtcblx0XHRcdGV4dEhvc3RNZXNzYWdlLnB1c2goY3VycmVudE1lc3NhZ2UpO1xuXHRcdH1cblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc3luY2VkRmlsZVNpemUgPSAoYXdhaXQgbWVzc2FnZUhhbmRsZXIucG9zdE1lc3NhZ2VXaXRoUmVzcG9uc2UoXCJlZGl0XCIsIGV4dEhvc3RNZXNzYWdlKSkuZmlsZVNpemU7XG5cdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQudXBkYXRlRG9jdW1lbnRTaXplKHN5bmNlZEZpbGVTaXplKTtcblx0XHR9IGNhdGNoIHtcblx0XHRcdC8vIEVtcHR5IGNhdGNoIGJlY2F1c2Ugd2UganVzdCBkb24ndCBkbyBhbnl0aGluZyBpZiBmb3Igc29tZSByZWFzb24gdGhlIGV4dGhvc3QgZG9lc24ndCByZXNwb25kIHdpdGggdGhlIG5ldyBmaWxlU2l6ZSxcblx0XHRcdC8vIHdlIGp1c3Qgc3luYyBhdCB0aGUgbmV4dCBhdmFpbGFibGUgb3Bwb3J0dW5pdHlcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEdpdmVuIGEgbGlzdCBvZiBlZGl0cyB1bmRvZXMgdGhlbSBmcm9tIHRoZSBkb2N1bWVudFxuXHQgKiBAcGFyYW0ge0VkaXRNZXNzYWdlW119IGVkaXRzIFRoZSBsaXN0IG9mIGVkaXRzIHRvIHVuZG9cblx0ICovXG5cdHB1YmxpYyB1bmRvKGVkaXRzOiBFZGl0TWVzc2FnZVtdKTogdm9pZCB7XG5cdFx0Ly8gV2Ugd2FudCB0byBwcm9jZXNzIHRoZSBoaWdoZXN0IG9mZnNldCBmaXJzdCBhcyB3ZSBvbmx5IHN1cHBvcnQgcmVtb3ZpbmcgY2VsbHMgZnJvbSB0aGUgZW5kIG9mIHRoZSBkb2N1bWVudFxuXHRcdC8vIFNvIGlmIHdlIG5lZWQgdG8gcmVtb3ZlIDMgY2VsbHMgd2UgY2FuJ3QgcmVtb3ZlIHRoZW0gaW4gYXJiaXRyYXJ5IG9yZGVyIGl0IG5lZWRzIHRvIGJlIG91dGVybW9zdCBjZWxsIGZpcnN0XG5cdFx0aWYgKGVkaXRzLmxlbmd0aCA+IDEgJiYgZWRpdHNbMF0ub2Zmc2V0IDwgZWRpdHNbZWRpdHMubGVuZ3RoIC0gMV0ub2Zmc2V0KSB7XG5cdFx0XHRlZGl0cyA9IGVkaXRzLnJldmVyc2UoKTtcblx0XHR9XG5cdFx0Zm9yIChjb25zdCBlZGl0IG9mIGVkaXRzKSB7XG5cdFx0XHQvLyBUaGlzIGlzIHRoZSBkZWxldGUgY2FzZVxuXHRcdFx0aWYgKGVkaXQub2xkVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQuZm9jdXNFbGVtZW50V2l0aEdpdmVuT2Zmc2V0KHZpcnR1YWxIZXhEb2N1bWVudC5kb2N1bWVudFNpemUpO1xuXHRcdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQucmVtb3ZlTGFzdENlbGwoKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBlbGVtZW50cyA9IGdldEVsZW1lbnRzV2l0aEdpdmVuT2Zmc2V0KGVkaXQub2Zmc2V0KTtcblx0XHRcdC8vIFdlJ3JlIGV4ZWN1dGluZyBhbiB1bmRvIGFuZCB0aGUgZWxlbWVudHMgYXJlbid0IG9uIHRoZSBET00gc28gdGhlcmUncyBubyBwb2ludCBpbiBkb2luZyBhbnl0aGluZ1xuXHRcdFx0aWYgKGVsZW1lbnRzLmxlbmd0aCAhPSAyKSByZXR1cm47XG5cdFx0XHRpZiAoZWRpdC5zYW1lT25EaXNrKSB7XG5cdFx0XHRcdGVsZW1lbnRzWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJlZGl0ZWRcIik7XG5cdFx0XHRcdGVsZW1lbnRzWzFdLmNsYXNzTGlzdC5yZW1vdmUoXCJlZGl0ZWRcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRlbGVtZW50c1swXS5jbGFzc0xpc3QuYWRkKFwiZWRpdGVkXCIpO1xuXHRcdFx0XHRlbGVtZW50c1sxXS5jbGFzc0xpc3QuYWRkKFwiZWRpdGVkXCIpO1xuXHRcdFx0fVxuXHRcdFx0ZWxlbWVudHNbMF0uaW5uZXJUZXh0ID0gZWRpdC5vbGRWYWx1ZS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcblx0XHRcdGVsZW1lbnRzWzBdLmlubmVyVGV4dCA9IGVsZW1lbnRzWzBdLmlubmVyVGV4dC5sZW5ndGggPT0gMiA/IGVsZW1lbnRzWzBdLmlubmVyVGV4dCA6IGAwJHtlbGVtZW50c1swXS5pbm5lclRleHR9YDtcblx0XHRcdHVwZGF0ZUFzY2lpVmFsdWUobmV3IEJ5dGVEYXRhKGVkaXQub2xkVmFsdWUpLCBlbGVtZW50c1sxXSk7XG5cdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQuZm9jdXNFbGVtZW50V2l0aEdpdmVuT2Zmc2V0KGVkaXQub2Zmc2V0KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEdpdmVuIGEgbGlzdCBvZiBlZGl0cyByZWFwcGxpZXMgdGhlbSB0byB0aGUgZG9jdW1lbnRcblx0ICogQHBhcmFtIHtFZGl0TWVzc2FnZVtdfSBlZGl0cyBUaGUgbGlzdCBvZiBlZGl0cyB0byByZWRvXG5cdCAqL1xuXHRwdWJsaWMgcmVkbyhlZGl0czogRWRpdE1lc3NhZ2VbXSk6IHZvaWQge1xuXHRcdGZvciAoY29uc3QgZWRpdCBvZiBlZGl0cykge1xuXHRcdFx0aWYgKGVkaXQubmV3VmFsdWUgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cdFx0XHRjb25zdCBlbGVtZW50cyA9IGdldEVsZW1lbnRzV2l0aEdpdmVuT2Zmc2V0KGVkaXQub2Zmc2V0KTtcblx0XHRcdC8vIFdlJ3JlIGV4ZWN1dGluZyBhbiByZWRvIGFuZCB0aGUgZWxlbWVudHMgYXJlbid0IG9uIHRoZSBET00gc28gdGhlcmUncyBubyBwb2ludCBpbiBkb2luZyBhbnl0aGluZ1xuXHRcdFx0aWYgKGVsZW1lbnRzLmxlbmd0aCAhPSAyKSBjb250aW51ZTtcblx0XHRcdGVsZW1lbnRzWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJhZGQtY2VsbFwiKTtcblx0XHRcdGVsZW1lbnRzWzFdLmNsYXNzTGlzdC5yZW1vdmUoXCJhZGQtY2VsbFwiKTtcblx0XHRcdGlmIChlZGl0LnNhbWVPbkRpc2spIHtcblx0XHRcdFx0ZWxlbWVudHNbMF0uY2xhc3NMaXN0LnJlbW92ZShcImVkaXRlZFwiKTtcblx0XHRcdFx0ZWxlbWVudHNbMV0uY2xhc3NMaXN0LnJlbW92ZShcImVkaXRlZFwiKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGVsZW1lbnRzWzBdLmNsYXNzTGlzdC5hZGQoXCJlZGl0ZWRcIik7XG5cdFx0XHRcdGVsZW1lbnRzWzFdLmNsYXNzTGlzdC5hZGQoXCJlZGl0ZWRcIik7XG5cdFx0XHR9XG5cdFx0XHRlbGVtZW50c1swXS5pbm5lclRleHQgPSBlZGl0Lm5ld1ZhbHVlLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuXHRcdFx0ZWxlbWVudHNbMF0uaW5uZXJUZXh0ID0gZWxlbWVudHNbMF0uaW5uZXJUZXh0Lmxlbmd0aCA9PSAyID8gZWxlbWVudHNbMF0uaW5uZXJUZXh0IDogYDAke2VsZW1lbnRzWzBdLmlubmVyVGV4dH1gO1xuXHRcdFx0dXBkYXRlQXNjaWlWYWx1ZShuZXcgQnl0ZURhdGEoZWRpdC5uZXdWYWx1ZSksIGVsZW1lbnRzWzFdKTtcblx0XHRcdC8vIElmIG5vIGFkZCBjZWxscyBhcmUgbGVmdCB3ZSBuZWVkIHRvIGFkZCBtb3JlIGFzIHRoaXMgbWVhbnMgd2UganVzdCByZXBsYWNlZCB0aGUgZW5kXG5cdFx0XHRpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImFkZC1jZWxsXCIpLmxlbmd0aCA9PT0gMCAmJiBlZGl0Lm9sZFZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Ly8gV2UgYXJlIGdvaW5nIHRvIGVzdGltYXRlIHRoZSBmaWxlc2l6ZSBhbmQgaXQgd2lsbCBiZSByZXN5bmNlZCBhdCB0aGUgZW5kIGlmIHdyb25nXG5cdFx0XHRcdC8vIFRoaXMgaXMgYmVjYXVzZSB3ZSBhZGQgMSBjZWxsIGF0IGEgdGltZSB0aGVyZWZvcmUgaWYgd2UgcGFzdGUgdGhlIGZpbGVzaXplIGlzIGxhcmdlciB0aGFuIHdoYXRzIHJlbmRlcmVkIGJyZWFraW5nIHRoZSBwbHVzIGNlbGwgbG9naWNcblx0XHRcdFx0Ly8gVGhpcyBjYXVzZXMgaXNzdWVzIHNvIHRoaXMgaXMgYSBxdWljayBmaXgsIGFub3RoZXIgZml4IHdvdWxkIGJlIHRvIGFwcGx5IGFsbCBjZWxscyBhdCBvbmNlXG5cdFx0XHRcdHZpcnR1YWxIZXhEb2N1bWVudC51cGRhdGVEb2N1bWVudFNpemUodmlydHVhbEhleERvY3VtZW50LmRvY3VtZW50U2l6ZSArIDEpO1xuXHRcdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQuY3JlYXRlQWRkQ2VsbCgpO1xuXHRcdFx0fVxuXHRcdFx0dmlydHVhbEhleERvY3VtZW50LmZvY3VzRWxlbWVudFdpdGhHaXZlbk9mZnNldChlZGl0Lm9mZnNldCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHdoZW4gYSB1c2VyIGNvcGllc1xuXHQgKiBAcGFyYW0ge0NsaXBib2FyZEV2ZW50fSBldmVudCBUaGUgY2xpYnBvYXJkIGV2ZW50IHBhc3NlZCB0byBhIGNvcHkgZXZlbnQgaGFuZGxlclxuXHQgKi9cblx0cHVibGljIGNvcHkoZXZlbnQ6IENsaXBib2FyZEV2ZW50KTogdm9pZCB7XG5cdFx0ZXZlbnQuY2xpcGJvYXJkRGF0YT8uc2V0RGF0YShcInRleHQvanNvblwiLCBKU09OLnN0cmluZ2lmeShTZWxlY3RIYW5kbGVyLmdldFNlbGVjdGVkSGV4KCkpKTtcblx0XHRldmVudC5jbGlwYm9hcmREYXRhPy5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBTZWxlY3RIYW5kbGVyLmdldFNlbGVjdGVkVmFsdWUoKSk7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB3aGVuIGEgdXNlciBwYXN0ZXNcblx0ICogQHBhcmFtIHtDbGlwYm9hcmRFdmVudH0gZXZlbnQgVGhlIGNsaWJwb2FyZCBldmVudCBwYXNzZWQgdG8gYSBwYXN0ZSBldmVudCBoYW5kbGVyXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgcGFzdGUoZXZlbnQ6IENsaXBib2FyZEV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gSWYgd2hhdCdzIG9uIHRoZSBjbGlwYm9hcmQgaXNuJ3QganNvbiB3ZSB3b24ndCB0cnkgdG8gcGFzdCBpdCBpblxuXHRcdGlmICghZXZlbnQuY2xpcGJvYXJkRGF0YSB8fCBldmVudC5jbGlwYm9hcmREYXRhLnR5cGVzLmluZGV4T2YoXCJ0ZXh0L2pzb25cIikgPCAwKSByZXR1cm47XG5cdFx0Y29uc3QgaGV4RGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuY2xpcGJvYXJkRGF0YS5nZXREYXRhKFwidGV4dC9qc29uXCIpKTtcblx0XHQvLyBXZSBkbyBBcnJheS5mcm9tKCkgYXMgdGhpcyBtYWtlcyBpdCBzbyB0aGUgYXJyYXkgbm8gbG9uZ2VyIGlzIHRpZWQgdG8gdGhlIGRvbSB3aG8ncyBzZWxlY3Rpb24gbWF5IGNoYW5nZSBkdXJpbmcgdGhpcyBwYXN0ZVxuXHRcdGNvbnN0IHNlbGVjdGVkID0gQXJyYXkuZnJvbShkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwic2VsZWN0ZWQgaGV4XCIpIGFzIEhUTUxDb2xsZWN0aW9uT2Y8SFRNTFNwYW5FbGVtZW50Pik7XG5cdFx0Y29uc3QgZWRpdHM6IERvY3VtZW50RWRpdFtdID0gW107XG5cdFx0Ly8gV2UgYXBwbHkgYXMgbXVjaCBvZiB0aGUgaGV4IGRhdGEgYXMgd2UgY2FuIGJhc2VkIG9uIHRoZSBzZWxlY3Rpb25cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdGVkLmxlbmd0aCAmJiBpIDwgaGV4RGF0YS5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgZWxlbWVudCA9IHNlbGVjdGVkW2ldO1xuXHRcdFx0Y29uc3Qgb2Zmc2V0OiBudW1iZXIgPSBnZXRFbGVtZW50c09mZnNldChlbGVtZW50KTtcblx0XHRcdGNvbnN0IGN1cnJlbnRFZGl0OiBEb2N1bWVudEVkaXQgPSB7XG5cdFx0XHRcdG9mZnNldDogb2Zmc2V0LFxuXHRcdFx0XHRwcmV2aW91c1ZhbHVlOiBlbGVtZW50LmlubmVyVGV4dCA9PT0gXCIrXCIgPyB1bmRlZmluZWQgOiBlbGVtZW50LmlubmVyVGV4dCxcblx0XHRcdFx0bmV3VmFsdWU6IGhleERhdGFbaV0sXG5cdFx0XHRcdGVsZW1lbnQ6IGVsZW1lbnRcblx0XHRcdH07XG5cdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJhZGQtY2VsbFwiKTtcblx0XHRcdC8vIE5vdCByZWFsbHkgYW4gZWRpdCBpZiBub3RoaW5nIGNoYW5nZWRcblx0XHRcdGlmIChjdXJyZW50RWRpdC5uZXdWYWx1ZSA9PSBjdXJyZW50RWRpdC5wcmV2aW91c1ZhbHVlKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0ZWxlbWVudC5pbm5lclRleHQgPSBoZXhEYXRhW2ldO1xuXHRcdFx0dGhpcy51cGRhdGVBc2NpaShlbGVtZW50LmlubmVyVGV4dCwgb2Zmc2V0KTtcblx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImVkaXRlZFwiKTtcblx0XHRcdC8vIE1lYW5zIHRoZSBsYXN0IGNlbGwgb2YgdGhlIGRvY3VtZW50IHdhcyBmaWxsZWQgaW4gc28gd2UgYWRkIGFub3RoZXIgcGxhY2Vob2xkZXIgYWZ0ZXJ3YXJkc1xuXHRcdFx0aWYgKGN1cnJlbnRFZGl0LnByZXZpb3VzVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQvLyBTaW5jZSB3ZSBkb24ndCBzZW5kIGFsbCB0aGUgZWRpdHMgdW50aWwgdGhlIGVuZCB3ZSBuZWVkIHRvIGVzdGltYXRlIHdoYXQgdGhlIGN1cnJlbnQgZmlsZSBzaXplIGlzIGR1cmluZyB0aGlzIG9wZXJhdGlvbiBvciB0aGUgbGFzdCBjZWxscyB3b24ndCBiZSBhZGRlZCBjb3JyZWN0bHlcblx0XHRcdFx0dmlydHVhbEhleERvY3VtZW50LnVwZGF0ZURvY3VtZW50U2l6ZSh2aXJ0dWFsSGV4RG9jdW1lbnQuZG9jdW1lbnRTaXplICsgMSk7XG5cdFx0XHRcdHZpcnR1YWxIZXhEb2N1bWVudC5jcmVhdGVBZGRDZWxsKCk7XG5cdFx0XHRcdHNlbGVjdGVkLnB1c2goZ2V0RWxlbWVudHNXaXRoR2l2ZW5PZmZzZXQodmlydHVhbEhleERvY3VtZW50LmRvY3VtZW50U2l6ZSlbMF0pO1xuXHRcdFx0fVxuXHRcdFx0ZWRpdHMucHVzaChjdXJyZW50RWRpdCk7XG5cdFx0fVxuXHRcdGF3YWl0IHRoaXMuc2VuZEVkaXRUb0V4dEhvc3QoZWRpdHMpO1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIENhbGxlZCB3aGVuIHRoZSB1c2VyIGV4ZWN1dGVzIHRoZSByZXZlcnQgY29tbWFuZCBvciB3aGVuIHRoZSBkb2N1bWVudCBjaGFuZ2VzIG9uIGRpc2sgYW5kIHRoZXJlIGFyZSBubyB1bnNhdmVkIGVkaXRzXG5cdCAqL1xuXHRwdWJsaWMgcmV2ZXJ0KCk6IHZvaWQge1xuXHRcdHZpcnR1YWxIZXhEb2N1bWVudC5yZVJlcXVlc3RDaHVua3MoKTtcblx0fVxufVxuIiwgIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBtZXNzYWdlSGFuZGxlciwgdmlydHVhbEhleERvY3VtZW50IH0gZnJvbSBcIi4vaGV4RWRpdFwiO1xuaW1wb3J0IHsgU2VsZWN0SGFuZGxlciB9IGZyb20gXCIuL3NlbGVjdEhhbmRsZXJcIjtcbmltcG9ydCB7IGhleFF1ZXJ5VG9BcnJheSB9IGZyb20gXCIuL3V0aWxcIjtcblxuaW50ZXJmYWNlIFNlYXJjaE9wdGlvbnMge1xuXHRyZWdleDogYm9vbGVhbjtcblx0Y2FzZVNlbnNpdGl2ZTogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIFNlYXJjaFJlc3VsdHMge1xuXHRyZXN1bHQ6IG51bWJlcltdW107XG5cdHBhcnRpYWw6IGJvb2xlYW47XG59XG5cbi8vIEFsbCB0aGUgbG9naWMgZm9yIHRoZSBzZWFyY2ggd2lkZ2V0XG4vLyBNYXkgd2FudCB0byByZWZhY3RvciBpbiB0aGUgZnV0dXJlIHRvIHNlcGFyYXRlIHRoZSB2aWV3IGFuZCB0aGUgZGF0YSBtb2RlbFxuZXhwb3J0IGNsYXNzIFNlYXJjaEhhbmRsZXIge1xuXHRwcml2YXRlIHNlYXJjaFJlc3VsdHM6IG51bWJlcltdW107XG5cdHByaXZhdGUgc2VhcmNoVHlwZTogXCJoZXhcIiB8IFwiYXNjaWlcIiA9IFwiaGV4XCI7XG5cdHByaXZhdGUgc2VhcmNoT3B0aW9uczogU2VhcmNoT3B0aW9ucztcblx0cHJpdmF0ZSBzZWFyY2hDb250YWluZXI6IEhUTUxEaXZFbGVtZW50O1xuXHRwcml2YXRlIHJlc3VsdEluZGV4ID0gMDtcblx0cHJpdmF0ZSBmaW5kVGV4dEJveDogSFRNTElucHV0RWxlbWVudDtcblx0cHJpdmF0ZSByZXBsYWNlVGV4dEJveDogSFRNTElucHV0RWxlbWVudDtcblx0cHJpdmF0ZSByZXBsYWNlQnV0dG9uOiBIVE1MU3BhbkVsZW1lbnQ7XG5cdHByaXZhdGUgcmVwbGFjZUFsbEJ1dHRvbjogSFRNTFNwYW5FbGVtZW50O1xuXHRwcml2YXRlIHByZXNlcnZlQ2FzZSA9IGZhbHNlO1xuXHRwcml2YXRlIGZpbmRQcmV2aW91c0J1dHRvbjogSFRNTFNwYW5FbGVtZW50O1xuXHRwcml2YXRlIGZpbmROZXh0QnV0dG9uOiBIVE1MU3BhbkVsZW1lbnQ7XG5cdHByaXZhdGUgc3RvcFNlYXJjaEJ1dHRvbjogSFRNTFNwYW5FbGVtZW50O1xuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gVGhlIEhUTUwgZm9yIHRoZSBzZWFyY2ggd2lkZ2V0LCBDU1MgaXMgdGFrZW4gZnJvbSBkaXN0L2hleEVkaXQuY3NzXG5cdCAqL1xuXHRwdWJsaWMgc3RhdGljIGdldFNlYXJjaFdpZGdldEhUTUwoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgICBTRUFSQ0ggSU5cbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJkYXRhLXR5cGVcIiBjbGFzcz1cImlubGluZS1zZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImhleFwiPkhleDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYXNjaWlcIj5UZXh0PC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwic2VhcmNoLXdpZGdldFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJhciBmaW5kLWJhclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaW5wdXQtZ2x5cGgtZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgYXV0b2NvbXBsZXRlPVwib2ZmXCIgc3BlbGxjaGVjaz1cIm9mZlwiIG5hbWU9XCJmaW5kXCIgaWQ9XCJmaW5kXCIgcGxhY2Vob2xkZXI9XCJGaW5kXCIvPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJhci1nbHlwaHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY29kaWNvbiBjb2RpY29uLWNhc2Utc2Vuc2l0aXZlXCIgaWQ9XCJjYXNlLXNlbnNpdGl2ZVwiIHRpdGxlPVwiTWF0Y2ggQ2FzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY29kaWNvbiBjb2RpY29uLXJlZ2V4XCIgaWQ9XCJyZWdleC1pY29uXCIgdGl0bGU9XCJVc2UgUmVndWxhciBFeHByZXNzaW9uXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJmaW5kLW1lc3NhZ2UtYm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImljb24tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJjb2RpY29uIGNvZGljb24tc2VhcmNoLXN0b3AgZGlzYWJsZWRcIiBpZD1cInNlYXJjaC1zdG9wXCIgdGl0bGU9XCJDYW5jZWwgU2VhcmNoXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImNvZGljb24gY29kaWNvbi1hcnJvdy11cCBkaXNhYmxlZFwiIGlkPVwiZmluZC1wcmV2aW91c1wiIHRpdGxlPVwiUHJldmlvdXMgTWF0Y2hcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY29kaWNvbiBjb2RpY29uLWFycm93LWRvd24gZGlzYWJsZWRcIiBpZD1cImZpbmQtbmV4dFwiIHRpdGxlPVwiTmV4dCBNYXRjaFwiPjwvc3Bhbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PHNwYW4gY2xhc3MgPVwiY29kaWNvbiBjb2RpY29uLWNsb3NlXCIgaWQ9XCJjbG9zZVwiIHRpdGxlPVwiQ2xvc2UgKEVzY2FwZSlcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYmFyIHJlcGxhY2UtYmFyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpbnB1dC1nbHlwaC1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBhdXRvY29tcGxldGU9XCJvZmZcIiBzcGVsbGNoZWNrPVwib2ZmXCIgbmFtZT1cInJlcGxhY2VcIiBpZD1cInJlcGxhY2VcIiBwbGFjZWhvbGRlcj1cIlJlcGxhY2VcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYmFyLWdseXBoc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJjb2RpY29uIGNvZGljb24tcHJlc2VydmUtY2FzZVwiIGlkPVwicHJlc2VydmUtY2FzZVwiIHRpdGxlPVwiUHJlc2VydmUgQ2FzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwicmVwbGFjZS1tZXNzYWdlLWJveFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvbi1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImNvZGljb24gY29kaWNvbi1yZXBsYWNlIGRpc2FibGVkXCIgaWQ9XCJyZXBsYWNlLWJ0blwiIHRpdGxlPVwiUmVwbGFjZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJjb2RpY29uIGNvZGljb24tcmVwbGFjZS1hbGwgZGlzYWJsZWRcIiBpZD1cInJlcGxhY2UtYWxsXCIgdGl0bGU9XCJSZXBsYWNlIEFsbFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+YDtcblx0fVxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuc2VhcmNoQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWFyY2gtY29udGFpbmVyXCIpIGFzIEhUTUxEaXZFbGVtZW50O1xuXHRcdC8vIFBvcHVsYXRlIHRoZSBjb250aWFuZXIgd2l0aCB0aGUgd2lkZ2V0IGFuZCB0aGVuIGhpZGUgdGhlIHdpZGdldFxuXHRcdHRoaXMuc2VhcmNoQ29udGFpbmVyLmlubmVySFRNTCA9IFNlYXJjaEhhbmRsZXIuZ2V0U2VhcmNoV2lkZ2V0SFRNTCgpO1xuXHRcdHRoaXMuc2VhcmNoUmVzdWx0cyA9IFtdO1xuXHRcdHRoaXMuc2VhcmNoT3B0aW9ucyA9IHtcblx0XHRcdHJlZ2V4OiBmYWxzZSxcblx0XHRcdGNhc2VTZW5zaXRpdmU6IGZhbHNlXG5cdFx0fTtcblx0XHR0aGlzLmZpbmRUZXh0Qm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaW5kXCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cdFx0dGhpcy5yZXBsYWNlVGV4dEJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVwbGFjZVwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXHRcdHRoaXMucmVwbGFjZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVwbGFjZS1idG5cIikgYXMgSFRNTFNwYW5FbGVtZW50O1xuXHRcdHRoaXMucmVwbGFjZUFsbEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVwbGFjZS1hbGxcIikgYXMgSFRNTFNwYW5FbGVtZW50O1xuXHRcdHRoaXMuZmluZFByZXZpb3VzQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaW5kLXByZXZpb3VzXCIpIGFzIEhUTUxTcGFuRWxlbWVudDtcblx0XHR0aGlzLmZpbmROZXh0QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaW5kLW5leHRcIikgYXMgSFRNTFNwYW5FbGVtZW50O1xuXHRcdHRoaXMuc3RvcFNlYXJjaEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VhcmNoLXN0b3BcIikgYXMgSFRNTFNwYW5FbGVtZW50O1xuXHRcdGNvbnN0IGNsb3NlQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjbG9zZVwiKSBhcyBIVE1MU3BhbkVsZW1lbnQ7XG5cdFx0dGhpcy5maW5kTmV4dEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5maW5kTmV4dCh0cnVlKSk7XG5cdFx0dGhpcy5maW5kUHJldmlvdXNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuZmluZFByZXZpb3VzKHRydWUpKTtcblx0XHR0aGlzLnVwZGF0ZUlucHV0R2x5cGhzKCk7XG5cdFx0Ly8gV2hlbmV2ZXIgdGhlIHVzZXIgY2hhbmdlcyB0aGUgZGF0YSB0eXBlIHdlIHVwZGF0ZSB0aGUgdHlwZSB3ZSdyZSBzZWFyY2hpbmcgZm9yIGFuZCB0aGUgZ2x5cGhzIG9uIHRoZSBpbnB1dCBib3hcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGEtdHlwZVwiKT8uYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZXZlbnQ6IEV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCBzZWxlY3RlZFZhbHVlID0gKGV2ZW50LnRhcmdldCBhcyBIVE1MU2VsZWN0RWxlbWVudCkudmFsdWUgYXMgXCJoZXhcIiB8IFwiYXNjaWlcIjtcblx0XHRcdHRoaXMuc2VhcmNoVHlwZSA9IHNlbGVjdGVkVmFsdWU7XG5cdFx0XHR0aGlzLnVwZGF0ZUlucHV0R2x5cGhzKCk7XG5cdFx0XHR0aGlzLnNlYXJjaCgpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5zZWFyY2hPcHRpb25zSGFuZGxlcigpO1xuXHRcdHRoaXMucmVwbGFjZU9wdGlvbnNIYW5kbGVyKCk7XG5cblx0XHQvLyBXaGVuIHRoZSB1c2VyIHByZXNzZXMgYSBrZXkgdHJpZ2dlciBhIHNlYXJjaFxuXHRcdHRoaXMuZmluZFRleHRCb3guYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuXHRcdFx0Ly8gU29tZSBWUyBDb2RlIGtleWJpbmRpbmcgZGVmdWFsdHMgZm9yIGZpbmQgbmV4dCwgZmluZCBwcmV2aW91cywgYW5kIGZvY3VzIHJlc3RvcmVcblx0XHRcdGlmICgoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgfHwgZXZlbnQua2V5ID09PSBcIkYzXCIpICYmIGV2ZW50LnNoaWZ0S2V5KSB7XG5cdFx0XHRcdHRoaXMuZmluZFByZXZpb3VzKGZhbHNlKTtcblx0XHRcdH0gZWxzZSBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgfHwgZXZlbnQua2V5ID09PSBcIkYzXCIpIHtcblx0XHRcdFx0dGhpcy5maW5kTmV4dChmYWxzZSk7XG5cdFx0XHR9IGVsc2UgaWYgKGV2ZW50LmtleSA9PT0gXCJFc2NhcGVcIikge1xuXHRcdFx0XHR0aGlzLmhpZGVXaWRnZXQoKTtcblx0XHRcdFx0Ly8gUHJlc3NpbmcgZXNjYXBlIHJldHVybnMgZm9jdXMgdG8gdGhlIGVkaXRvclxuXHRcdFx0XHRjb25zdCBzZWxlY3RlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoYHNlbGVjdGVkICR7dGhpcy5zZWFyY2hUeXBlfWApWzBdIGFzIEhUTUxTcGFuRWxlbWVudCB8IHVuZGVmaW5lZDtcblx0XHRcdFx0aWYgKHNlbGVjdGVkICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRzZWxlY3RlZC5mb2N1cygpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZpcnR1YWxIZXhEb2N1bWVudC5mb2N1c0VsZW1lbnRXaXRoR2l2ZW5PZmZzZXQodmlydHVhbEhleERvY3VtZW50LnRvcE9mZnNldCgpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChldmVudC5jdHJsS2V5IHx8IG5ldyBSZWdFeHAoXCIoXkFycm93fF5FbmR8XkhvbWUpXCIsIFwiaVwiKS50ZXN0KGV2ZW50LmtleSkpIHtcblx0XHRcdFx0Ly8gSWYgaXQncyBhbnkgc29ydCBvZiBuYXZpZ2F0aW9uIGtleSB3ZSBkb24ndCB3YW50IHRvIHRyaWdnZXIgYW5vdGhlciBzZWFyY2ggYXMgbm90aGluZyBoYXMgY2hhbmdlZFxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnNlYXJjaCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0XHQvLyBGaW4gcHJldmlvdXMgKyBmaW5kIG5leHQgd2hlbiB3aWRnZXQgaXNuJ3QgZm9jdXNlZFxuXHRcdFx0aWYgKGV2ZW50LmtleSA9PT0gXCJGM1wiICYmIGV2ZW50LnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IHRoaXMuZmluZFRleHRCb3gpIHtcblx0XHRcdFx0dGhpcy5maW5kUHJldmlvdXModHJ1ZSk7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9IGVsc2UgaWYgKGV2ZW50LmtleSA9PT0gXCJGM1wiICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IHRoaXMuZmluZFRleHRCb3gpIHtcblx0XHRcdFx0dGhpcy5maW5kTmV4dCh0cnVlKTtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMucmVwbGFjZVRleHRCb3guYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMudXBkYXRlUmVwbGFjZUJ1dHRvbnMuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5yZXBsYWNlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLnJlcGxhY2UoZmFsc2UpKTtcblx0XHR0aGlzLnJlcGxhY2VBbGxCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMucmVwbGFjZSh0cnVlKSk7XG5cdFx0dGhpcy5zdG9wU2VhcmNoQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNhbmNlbFNlYXJjaC5iaW5kKHRoaXMpKTtcblx0XHRjbG9zZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5oaWRlV2lkZ2V0KCkpO1xuXHRcdC8vIEhpZGUgdGhlIG1lc3NhZ2UgYm94ZXMgZm9yIG5vdyBhcyBhdCBmaXJzdCB3ZSBoYXZlIG5vIG1lc3NhZ2VzIHRvIGRpc3BsYXlcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbmQtbWVzc2FnZS1ib3hcIikhLmhpZGRlbiA9IHRydWU7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXBsYWNlLW1lc3NhZ2UtYm94XCIpIS5oaWRkZW4gPSB0cnVlO1xuXG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFNlbmRzIGEgc2VhcmNoIHJlcXVlc3QgdG8gdGhlIGV4dGhvc3Rcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgc2VhcmNoKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIElmIHRoZSBib3ggaXMgZW1wdHkgbm8gbmVlZCB0byBkaXNwbGF5IGFueSB3YXJuaW5ncyBvciBleGVjdXRlIGEgc2VhcmNoXG5cdFx0aWYgKHRoaXMuZmluZFRleHRCb3gudmFsdWUgPT09IFwiXCIpIHtcblx0XHRcdHRoaXMucmVtb3ZlSW5wdXRNZXNzYWdlKFwiZmluZFwiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly8gVGhpcyBnZXRzIGNhbGxlZCB0byBjYW5jZWwgYW55IHNlYXJjaGVzIHRoYXQgbWlnaHQgYmUgZ29pbmcgb24gbm93XG5cdFx0dGhpcy5jYW5jZWxTZWFyY2goKTtcblx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQuc2V0U2VsZWN0aW9uKFtdKTtcblx0XHR0aGlzLnNlYXJjaFJlc3VsdHMgPSBbXTtcblx0XHR0aGlzLnVwZGF0ZVJlcGxhY2VCdXR0b25zKCk7XG5cdFx0dGhpcy5maW5kTmV4dEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG5cdFx0dGhpcy5maW5kUHJldmlvdXNCdXR0b24uY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuXHRcdGxldCBxdWVyeTogc3RyaW5nIHwgc3RyaW5nW10gPSB0aGlzLmZpbmRUZXh0Qm94LnZhbHVlO1xuXHRcdGNvbnN0IGhleFNlYXJjaFJlZ2V4ID0gbmV3IFJlZ0V4cChcIl5bYS1mQS1GMC05PyBdKyRcIik7XG5cdFx0Ly8gV2UgY2hlY2sgdG8gc2VlIGlmIHRoZSBoZXggaXMgYSB2YWxpZCBxdWVyeSBlbHNlIHdlIGRvbid0IGFsbG93IGEgc2VhcmNoXG5cdFx0aWYgKHRoaXMuc2VhcmNoVHlwZSA9PT0gXCJoZXhcIiAmJiAhaGV4U2VhcmNoUmVnZXgudGVzdChxdWVyeSkpIHtcblx0XHRcdGlmIChxdWVyeS5sZW5ndGggPiAwKSB0aGlzLmFkZElucHV0TWVzc2FnZShcImZpbmRcIiwgXCJJbnZhbGlkIHF1ZXJ5XCIsIFwiZXJyb3JcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdC8vIFRlc3QgaWYgaXQncyBhIHZhbGlkIHJlZ2V4XG5cdFx0aWYgKHRoaXMuc2VhcmNoT3B0aW9ucy5yZWdleCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bmV3IFJlZ0V4cChxdWVyeSk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0Ly8gU3BsaXQgdXAgdGhlIGVycm9yIG1lc3NhZ2UgdG8gZml0IGluIHRoZSBib3guIEluIHRoZSBmdXR1cmUgd2UgbWlnaHQgd2FudCB0aGUgYm94IHRvIGRvIHdvcmQgd3JhcHBpbmdcblx0XHRcdFx0Ly8gU28gdGhhdCBpdCdzIG5vdCBhIG1hbnVhbCBlbmRlYXZvclxuXHRcdFx0XHRjb25zdCBtZXNzYWdlID0gKGVyci5tZXNzYWdlIGFzIHN0cmluZykuc3Vic3RyKDAsIDI3KSArIFwiXFxuXCIgKyAoZXJyLm1lc3NhZ2UgYXMgc3RyaW5nKS5zdWJzdHIoMjcpO1xuXHRcdFx0XHR0aGlzLmFkZElucHV0TWVzc2FnZShcImZpbmRcIiwgbWVzc2FnZSwgXCJlcnJvclwiKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRxdWVyeSA9IHRoaXMuc2VhcmNoVHlwZSA9PT0gXCJoZXhcIiA/IGhleFF1ZXJ5VG9BcnJheShxdWVyeSkgOiBxdWVyeTtcblx0XHRpZiAocXVlcnkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHQvLyBJZiB0aGUgdXNlciBkaWRuJ3QgdHlwZSBhbnl0aGluZyBhbmQgaXRzIGp1c3QgYSBibGFuayBxdWVyeSB3ZSBkb24ndCB3YW50IHRvIGVycm9yIG9uIHRoZW1cblx0XHRcdGlmICh0aGlzLmZpbmRUZXh0Qm94LnZhbHVlLmxlbmd0aCA+IDApIHRoaXMuYWRkSW5wdXRNZXNzYWdlKFwiZmluZFwiLCBcIkludmFsaWQgcXVlcnlcIiwgXCJlcnJvclwiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5zdG9wU2VhcmNoQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJkaXNhYmxlZFwiKTtcblx0XHRsZXQgcmVzdWx0czogU2VhcmNoUmVzdWx0cztcblx0XHR0aGlzLnJlbW92ZUlucHV0TWVzc2FnZShcImZpbmRcIik7XG5cdFx0Ly8gVGhpcyBpcyB3cmFwcGVkIGluIGEgdHJ5IGNhdGNoIGJlY2F1c2UgaWYgdGhlIG1lc3NhZ2UgaGFuZGxlciBnZXRzIGJhY2tlZCB1cCB0aGlzIHdpbGwgcmVqZWN0XG5cdFx0dHJ5IHtcblx0XHRcdHJlc3VsdHMgPSAoYXdhaXQgbWVzc2FnZUhhbmRsZXIucG9zdE1lc3NhZ2VXaXRoUmVzcG9uc2UoXCJzZWFyY2hcIiwge1xuXHRcdFx0XHRxdWVyeTogcXVlcnksXG5cdFx0XHRcdHR5cGU6IHRoaXMuc2VhcmNoVHlwZSxcblx0XHRcdFx0b3B0aW9uczogdGhpcy5zZWFyY2hPcHRpb25zXG5cdFx0XHR9KSBhcyB7IHJlc3VsdHM6IFNlYXJjaFJlc3VsdHMgfSkucmVzdWx0cztcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdHRoaXMuc3RvcFNlYXJjaEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG5cdFx0XHR0aGlzLmFkZElucHV0TWVzc2FnZShcImZpbmRcIiwgXCJTZWFyY2ggcmV0dXJuZWQgYW4gZXJyb3IhXCIsIFwiZXJyb3JcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmIChyZXN1bHRzLnBhcnRpYWwpIHtcblx0XHRcdHRoaXMuYWRkSW5wdXRNZXNzYWdlKFwiZmluZFwiLCBcIlBhcnRpYWwgcmVzdWx0cyByZXR1cm5lZCwgdHJ5XFxuIG5hcnJvd2luZyB5b3VyIHF1ZXJ5LlwiLCBcIndhcm5pbmdcIik7XG5cdFx0fVxuXHRcdHRoaXMuc3RvcFNlYXJjaEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG5cdFx0dGhpcy5yZXN1bHRJbmRleCA9IDA7XG5cdFx0dGhpcy5zZWFyY2hSZXN1bHRzID0gcmVzdWx0cy5yZXN1bHQ7XG5cdFx0Ly8gSWYgd2UgZ290IHJlc3VsdHMgdGhlbiB3ZSBzZWxlY3QgdGhlIGZpcnN0IHJlc3VsdCBhbmQgdW5sb2NrIHRoZSBidXR0b25zXG5cdFx0aWYgKHRoaXMuc2VhcmNoUmVzdWx0cy5sZW5ndGggIT09IDApIHtcblx0XHRcdGF3YWl0IHZpcnR1YWxIZXhEb2N1bWVudC5zY3JvbGxEb2N1bWVudFRvT2Zmc2V0KHRoaXMuc2VhcmNoUmVzdWx0c1t0aGlzLnJlc3VsdEluZGV4XVswXSk7XG5cdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQuc2V0U2VsZWN0aW9uKHRoaXMuc2VhcmNoUmVzdWx0c1t0aGlzLnJlc3VsdEluZGV4XSk7XG5cdFx0XHQvLyBJZiB0aGVyZSdzIG1vcmUgdGhhbiBvbmUgc2VhcmNoIHJlc3VsdCB3ZSB1bmxvY2sgdGhlIGZpbmQgbmV4dCBidXR0b25cblx0XHRcdGlmICh0aGlzLnJlc3VsdEluZGV4ICsgMSA8IHRoaXMuc2VhcmNoUmVzdWx0cy5sZW5ndGgpIHtcblx0XHRcdFx0dGhpcy5maW5kTmV4dEJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZGlzYWJsZWRcIik7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnVwZGF0ZVJlcGxhY2VCdXR0b25zKCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHdoZW4gdGhlIHVzZXIgY2xpY2tzIHRoZSBmaW5kIG5leHQgaWNvblxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGZvY3VzIFdoZXRoZXIgb3Igbm90IHRvIGZvY3VzIHRoZSBzZWxlY3Rpb25cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgZmluZE5leHQoZm9jdXM6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBJZiB0aGUgYnV0dG9uIGlzIGRpc2FibGVkIHRoZW4gdGhpcyBmdW5jdGlvbiBzaG91bGRuJ3Qgd29ya1xuXHRcdGlmICh0aGlzLmZpbmROZXh0QnV0dG9uLmNsYXNzTGlzdC5jb250YWlucyhcImRpc2FibGVkXCIpKSByZXR1cm47XG5cdFx0YXdhaXQgdmlydHVhbEhleERvY3VtZW50LnNjcm9sbERvY3VtZW50VG9PZmZzZXQodGhpcy5zZWFyY2hSZXN1bHRzWysrdGhpcy5yZXN1bHRJbmRleF1bMF0pO1xuXHRcdHZpcnR1YWxIZXhEb2N1bWVudC5zZXRTZWxlY3Rpb24odGhpcy5zZWFyY2hSZXN1bHRzW3RoaXMucmVzdWx0SW5kZXhdKTtcblx0XHRpZiAoZm9jdXMpIFNlbGVjdEhhbmRsZXIuZm9jdXNTZWxlY3Rpb24odGhpcy5zZWFyY2hUeXBlKTtcblx0XHQvLyBJZiB0aGVyZSdzIG1vcmUgdGhhbiBvbmUgc2VhcmNoIHJlc3VsdCB3ZSB1bmxvY2sgdGhlIGZpbmQgbmV4dCBidXR0b25cblx0XHRpZiAodGhpcy5yZXN1bHRJbmRleCA8IHRoaXMuc2VhcmNoUmVzdWx0cy5sZW5ndGggLSAxKSB7XG5cdFx0XHR0aGlzLmZpbmROZXh0QnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJkaXNhYmxlZFwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5maW5kTmV4dEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG5cdFx0fVxuXHRcdC8vIFdlIGFsc28gdW5sb2NrIHRoZSBmaW5kIHByZXZpb3VzIGJ1dHRvbiBpZiB0aGVyZSBpcyBhIHByZXZpb3VzXG5cdFx0aWYgKHRoaXMucmVzdWx0SW5kZXggIT0gMCkge1xuXHRcdFx0dGhpcy5maW5kUHJldmlvdXNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZShcImRpc2FibGVkXCIpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB3aGVuIHRoZSB1c2VyIGNsaWNrcyB0aGUgZmluZCBwcmV2aW91cyBpY29uXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9jdXMgV2hldGhlciBvciBub3QgdG8gZm9jdXMgdGhlIHNlbGVjdGlvblxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBmaW5kUHJldmlvdXMoZm9jdXM6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBJZiB0aGUgYnV0dG9uIGlzIGRpc2FibGVkIHRoZW4gdGhpcyBmdW5jdGlvbiBzaG91bGRuJ3Qgd29ya1xuXHRcdGlmICh0aGlzLmZpbmRQcmV2aW91c0J1dHRvbi5jbGFzc0xpc3QuY29udGFpbnMoXCJkaXNhYmxlZFwiKSkgcmV0dXJuO1xuXHRcdGF3YWl0IHZpcnR1YWxIZXhEb2N1bWVudC5zY3JvbGxEb2N1bWVudFRvT2Zmc2V0KHRoaXMuc2VhcmNoUmVzdWx0c1stLXRoaXMucmVzdWx0SW5kZXhdWzBdKTtcblx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQuc2V0U2VsZWN0aW9uKHRoaXMuc2VhcmNoUmVzdWx0c1t0aGlzLnJlc3VsdEluZGV4XSk7XG5cdFx0aWYgKGZvY3VzKSBTZWxlY3RIYW5kbGVyLmZvY3VzU2VsZWN0aW9uKHRoaXMuc2VhcmNoVHlwZSk7XG5cdFx0Ly8gSWYgdGhleSBwcmVzc2VkIHByZXZpb3VzLCB0aGV5IGNhbiBhbHdheXMgZ28gbmV4dCB0aGVyZWZvcmUgd2UgYWx3YXlzIHVubG9jayB0aGUgbmV4dCBidXR0b25cblx0XHR0aGlzLmZpbmROZXh0QnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJkaXNhYmxlZFwiKTtcblx0XHQvLyBXZSBsb2NrIHRoZSBmaW5kIHByZXZpb3VzIGlmIHRoZXJlIGlzbid0IGEgcHJldmlvdXMgYW55bW9yZVxuXHRcdGlmICh0aGlzLnJlc3VsdEluZGV4ID09IDApIHtcblx0XHRcdHRoaXMuZmluZFByZXZpb3VzQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgd2hlbiB0aGUgdXNlciB0b2dnZWxzIGJldHdlZW4gdGV4dCBhbmQgaGV4IHNob3dpbmcgdGhlIGlucHV0IGdseXBocyBhbmQgZW5zdXJlaW5nIGNvcnJlY3QgcGFkZGluZ1xuXHQgKi9cblx0cHJpdmF0ZSB1cGRhdGVJbnB1dEdseXBocygpOiB2b2lkIHtcblx0XHQvLyBUaGUgZ2x5cGggaWNvbnMgdGhhdCBzaXQgaW4gdGhlIGZpbmQgYW5kIHJlcGxhY2UgYmFyXG5cdFx0Y29uc3QgaW5wdXRHbHlwaHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiYmFyLWdseXBoc1wiKSBhcyBIVE1MQ29sbGVjdGlvbk9mPEhUTUxTcGFuRWxlbWVudD47XG5cdFx0Y29uc3QgaW5wdXRGaWVsZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmJhciA+IC5pbnB1dC1nbHlwaC1ncm91cCA+IGlucHV0XCIpIGFzIE5vZGVMaXN0T2Y8SFRNTElucHV0RWxlbWVudD47XG5cdFx0aWYgKHRoaXMuc2VhcmNoVHlwZSA9PSBcImhleFwiKSB7XG5cdFx0XHRpbnB1dEdseXBoc1swXS5oaWRkZW4gPSB0cnVlO1xuXHRcdFx0aW5wdXRHbHlwaHNbMV0uaGlkZGVuID0gdHJ1ZTtcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0taW5wdXQtZ2x5cGgtcGFkZGluZ1wiLCBcIjBweFwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEdseXBocy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpbnB1dEdseXBoc1tpXS5oaWRkZW4gPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IGdseXBoUmVjdCA9IGlucHV0R2x5cGhzWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0Y29uc3QgaW5wdXRSZWN0ID0gaW5wdXRGaWVsZHNbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHQvLyBDYWxjdWxhdGVzIGhvdyBtdWNoIHBhZGRpbmcgd2Ugc2hvdWxkIGhhdmUgc28gdGhhdCB0aGUgdGV4dCBkb2Vzbid0IHJ1biBpbnRvIHRoZSBnbHlwaHNcblx0XHRcdGNvbnN0IGlucHV0UGFkZGluZyA9IChpbnB1dFJlY3QueCArIGlucHV0UmVjdC53aWR0aCArIDEpIC0gZ2x5cGhSZWN0Lng7XG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoXCItLWlucHV0LWdseXBoLXBhZGRpbmdcIiwgYCR7aW5wdXRQYWRkaW5nfXB4YCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIGxpc3RlbmluZyB0byB0aGUgc2VhcmNoIG9wdGlvbnMgYW5kIHVwZGF0aW5nIHRoZW1cblx0ICovXG5cdHByaXZhdGUgc2VhcmNoT3B0aW9uc0hhbmRsZXIoKTogdm9pZCB7XG5cdFx0Ly8gVG9nZ2xlIFJlZ2V4XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZWdleC1pY29uXCIpPy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCByZWdleEljb24gPSBldmVudC50YXJnZXQgYXMgSFRNTFNwYW5FbGVtZW50O1xuXHRcdFx0aWYgKHJlZ2V4SWNvbi5jbGFzc0xpc3QuY29udGFpbnMoXCJ0b2dnbGVkXCIpKSB7XG5cdFx0XHRcdHRoaXMuc2VhcmNoT3B0aW9ucy5yZWdleCA9IGZhbHNlO1xuXHRcdFx0XHRyZWdleEljb24uY2xhc3NMaXN0LnJlbW92ZShcInRvZ2dsZWRcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnNlYXJjaE9wdGlvbnMucmVnZXggPSB0cnVlO1xuXHRcdFx0XHRyZWdleEljb24uY2xhc3NMaXN0LmFkZChcInRvZ2dsZWRcIik7XG5cdFx0XHR9XG5cdFx0XHQvLyBUaGUgdXNlciBpcyBjaGFuZ2luZyBhbiBvcHRpb24gc28gd2Ugc2hvdWxkIHRyaWdnZXIgYW5vdGhlciBzZWFyY2hcblx0XHRcdHRoaXMuc2VhcmNoKCk7XG5cdFx0fSk7XG5cdFx0Ly8gVG9nZ2xlIGNhc2Ugc2Vuc2l0aXZlXG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYXNlLXNlbnNpdGl2ZVwiKT8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuXHRcdFx0Y29uc3QgY2FzZVNlbnNpdGl2ZSA9IGV2ZW50LnRhcmdldCBhcyBIVE1MU3BhbkVsZW1lbnQ7XG5cdFx0XHRpZiAoY2FzZVNlbnNpdGl2ZS5jbGFzc0xpc3QuY29udGFpbnMoXCJ0b2dnbGVkXCIpKSB7XG5cdFx0XHRcdHRoaXMuc2VhcmNoT3B0aW9ucy5jYXNlU2Vuc2l0aXZlID0gZmFsc2U7XG5cdFx0XHRcdGNhc2VTZW5zaXRpdmUuY2xhc3NMaXN0LnJlbW92ZShcInRvZ2dsZWRcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnNlYXJjaE9wdGlvbnMuY2FzZVNlbnNpdGl2ZSA9IHRydWU7XG5cdFx0XHRcdGNhc2VTZW5zaXRpdmUuY2xhc3NMaXN0LmFkZChcInRvZ2dsZWRcIik7XG5cdFx0XHR9XG5cdFx0XHQvLyBUaGUgdXNlciBpcyBjaGFuZ2luZyBhbiBvcHRpb24gc28gd2Ugc2hvdWxkIHRyaWdnZXIgYW5vdGhlciBzZWFyY2hcblx0XHRcdHRoaXMuc2VhcmNoKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIHJlcGxhY2VPcHRpb25zSGFuZGxlcigpOiB2b2lkIHtcblx0XHQvLyBUb2dnbGUgcHJlc2VydmUgY2FzZVxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJlc2VydmUtY2FzZVwiKT8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuXHRcdFx0Y29uc3QgcHJlc2VydmVDYXNlID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxTcGFuRWxlbWVudDtcblx0XHRcdGlmIChwcmVzZXJ2ZUNhc2UuY2xhc3NMaXN0LmNvbnRhaW5zKFwidG9nZ2xlZFwiKSkge1xuXHRcdFx0XHR0aGlzLnByZXNlcnZlQ2FzZSA9IGZhbHNlO1xuXHRcdFx0XHRwcmVzZXJ2ZUNhc2UuY2xhc3NMaXN0LnJlbW92ZShcInRvZ2dsZWRcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnByZXNlcnZlQ2FzZSA9IHRydWU7XG5cdFx0XHRcdHByZXNlcnZlQ2FzZS5jbGFzc0xpc3QuYWRkKFwidG9nZ2xlZFwiKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB3aGVuIHRoZSB1c2VyIGhpdHMgdGhlIHN0b3Agc2VhcmNoIGJ1dHRvblxuXHQgKi9cblx0cHJpdmF0ZSBjYW5jZWxTZWFyY2goKTogdm9pZCB7XG5cdFx0aWYgKHRoaXMuc3RvcFNlYXJjaEJ1dHRvbi5jbGFzc0xpc3QuY29udGFpbnMoXCJkaXNhYmxlZFwiKSkgcmV0dXJuO1xuXHRcdC8vIFdlIGRvbid0IHdhbnQgdGhlIHVzZXIgdG8ga2VlcCBleGVjdXRpbmcgdGhpcywgc28gd2UgZGlzYWJsZSB0aGUgYnV0dG9uIGFmdGVyIHRoZSBmaXJzdCBzZWFyY2hcblx0XHR0aGlzLnN0b3BTZWFyY2hCdXR0b24uY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuXHRcdC8vIFdlIHNlbmQgYSBjYW5jZWxsYXRpb24gbWVzc2FnZSB0byB0aGUgZXh0aG9zdCwgdGhlcmUncyBubyBuZWVkIHRvICB3YWl0IGZvciBhIHJlc3BvbnNlXG5cdFx0Ly8gQXMgd2UncmUgbm90IGV4cGVjdGluZyBhbnl0aGluZyBiYWNrIGp1c3QgdG8gc3RvcCBwcm9jZXNzaW5nIHRoZSBzZWFyY2hcblx0XHRtZXNzYWdlSGFuZGxlci5wb3N0TWVzc2FnZVdpdGhSZXNwb25zZShcInNlYXJjaFwiLCB7IGNhbmNlbDogdHJ1ZSB9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGhhbmRsZXMgbG9ja2luZyAvIHVubG9ja2luZyB0aGUgcmVwbGFjZSBidXR0b25zXG5cdCAqL1xuXHRwcml2YXRlIHVwZGF0ZVJlcGxhY2VCdXR0b25zKCk6IHZvaWQge1xuXHRcdHRoaXMucmVtb3ZlSW5wdXRNZXNzYWdlKFwicmVwbGFjZVwiKTtcblx0XHRjb25zdCBoZXhSZXBsYWNlUmVnZXggPSBuZXcgUmVnRXhwKFwiXlthLWZBLUYwLTldKyRcIik7XG5cdFx0Ly8gSWYgaXQncyBub3QgYSB2YWxpZCBoZXggcXVlcnkgd2UgbG9jayB0aGUgYnV0dG9ucywgd2UgcmVtb3ZlIHdoaXRlc3BhY2UgZnJvbSB0aGUgc3RyaW5nIHRvIHNpbXBsaWZ5IHRoZSByZWdleFxuXHRcdGNvbnN0IHF1ZXJ5Tm9TcGFjZXMgPSB0aGlzLnJlcGxhY2VUZXh0Qm94LnZhbHVlLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcblx0XHRpZiAodGhpcy5zZWFyY2hUeXBlID09PSBcImhleFwiICYmICFoZXhSZXBsYWNlUmVnZXgudGVzdChxdWVyeU5vU3BhY2VzKSkge1xuXHRcdFx0dGhpcy5yZXBsYWNlQWxsQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcblx0XHRcdHRoaXMucmVwbGFjZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG5cdFx0XHRpZiAodGhpcy5yZXBsYWNlVGV4dEJveC52YWx1ZS5sZW5ndGggPiAwKSB0aGlzLmFkZElucHV0TWVzc2FnZShcInJlcGxhY2VcIiwgXCJJbnZhbGlkIHJlcGxhY2VtZW50XCIsIFwiZXJyb3JcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnN0IHJlcGxhY2VRdWVyeSA9IHRoaXMucmVwbGFjZVRleHRCb3gudmFsdWU7XG5cdFx0Y29uc3QgcmVwbGFjZUFycmF5ID0gdGhpcy5zZWFyY2hUeXBlID09PSBcImhleFwiID8gaGV4UXVlcnlUb0FycmF5KHJlcGxhY2VRdWVyeSkgOiBBcnJheS5mcm9tKHJlcGxhY2VRdWVyeSk7XG5cdFx0aWYgKHRoaXMuc2VhcmNoUmVzdWx0cy5sZW5ndGggIT09IDAgJiYgcmVwbGFjZUFycmF5Lmxlbmd0aCAhPT0gMCkge1xuXHRcdFx0dGhpcy5yZXBsYWNlQWxsQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJkaXNhYmxlZFwiKTtcblx0XHRcdHRoaXMucmVwbGFjZUJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZGlzYWJsZWRcIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICh0aGlzLnJlcGxhY2VUZXh0Qm94LnZhbHVlLmxlbmd0aCA+IDAgJiYgcmVwbGFjZUFycmF5Lmxlbmd0aCA9PT0gMCkgdGhpcy5hZGRJbnB1dE1lc3NhZ2UoXCJyZXBsYWNlXCIsIFwiSW52YWxpZCByZXBsYWNlbWVudFwiLCBcImVycm9yXCIpO1xuXHRcdFx0dGhpcy5yZXBsYWNlQWxsQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcblx0XHRcdHRoaXMucmVwbGFjZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHdoZW4gdGhlIHVzZXIgY2xpY2tzIHJlcGxhY2Ugb3IgcmVwbGFjZSBhbGxcblx0ICogQHBhcmFtIHtib29sZWFufSBhbGwgd2hldGhlciB0aGlzIGlzIGEgbm9ybWFsIHJlcGxhY2Ugb3IgYSByZXBsYWNlIGFsbFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyByZXBsYWNlKGFsbDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHJlcGxhY2VRdWVyeSA9IHRoaXMucmVwbGFjZVRleHRCb3gudmFsdWU7XG5cdFx0Y29uc3QgcmVwbGFjZUFycmF5ID0gdGhpcy5zZWFyY2hUeXBlID09PSBcImhleFwiID8gaGV4UXVlcnlUb0FycmF5KHJlcGxhY2VRdWVyeSkgOiBBcnJheS5mcm9tKHJlcGxhY2VRdWVyeSk7XG5cdFx0bGV0IHJlcGxhY2VCaXRzOiBudW1iZXJbXSA9IFtdO1xuXHRcdC8vIFNpbmNlIHRoZSBleHRob3N0IG9ubHkgaG9sZHMgZGF0YSBpbiA4IGJpdCB1bnNpZ25lZCBpbnRzIHdlIG11c3QgY29udmVydCBpdCBiYWNrXG5cdFx0aWYgKHRoaXMuc2VhcmNoVHlwZSA9PT0gXCJoZXhcIikge1xuXHRcdFx0cmVwbGFjZUJpdHMgPSByZXBsYWNlQXJyYXkubWFwKHZhbCA9PiBwYXJzZUludCh2YWwsIDE2KSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlcGxhY2VCaXRzID0gcmVwbGFjZUFycmF5Lm1hcCh2YWwgPT4gdmFsLmNoYXJDb2RlQXQoMCkpO1xuXHRcdH1cblxuXHRcdGxldCBvZmZzZXRzOiBudW1iZXJbXVtdID0gW107XG5cdFx0aWYgKGFsbCkge1xuXHRcdFx0b2Zmc2V0cyA9IHRoaXMuc2VhcmNoUmVzdWx0cztcblx0XHR9IGVsc2Uge1xuXHRcdFx0b2Zmc2V0cyA9IFt0aGlzLnNlYXJjaFJlc3VsdHNbdGhpcy5yZXN1bHRJbmRleF1dO1xuXHRcdH1cblxuXHRcdGNvbnN0IGVkaXRzID0gKGF3YWl0IG1lc3NhZ2VIYW5kbGVyLnBvc3RNZXNzYWdlV2l0aFJlc3BvbnNlKFwicmVwbGFjZVwiLCB7XG5cdFx0XHRxdWVyeTogcmVwbGFjZUJpdHMsXG5cdFx0XHRvZmZzZXRzOiBvZmZzZXRzLFxuXHRcdFx0cHJlc2VydmVDYXNlOiB0aGlzLnByZXNlcnZlQ2FzZVxuXHRcdH0pKS5lZGl0cztcblx0XHQvLyBXZSBjYW4gcGFzcyB0aGUgc2l6ZSBvZiB0aGUgZG9jdW1lbnQgYmFjayBpbiBiZWNhdXNlIHdpdGggdGhlIGN1cnJlbnQgaW1wbGVtZW50YXRpb25cblx0XHQvLyBUaGUgc2l6ZSBvZiB0aGUgZG9jdW1lbnQgd2lsbCBuZXZlciBjaGFuZ2UgYXMgd2Ugb25seSByZXBsYWNlIHByZWV4aXN0aW5nIGNlbGxzXG5cdFx0dmlydHVhbEhleERvY3VtZW50LnJlZG8oZWRpdHMsIHZpcnR1YWxIZXhEb2N1bWVudC5kb2N1bWVudFNpemUpO1xuXHRcdHRoaXMuZmluZE5leHQodHJ1ZSk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEZ1bmN0aW9uIHJlc3BvbnNpYmxlIGZvciBoYW5kbGluZyB3aGVuIHRoZSB1c2VyIHByZXNzZXMgY21kIC8gY3RybCArIGYgdXBkYXRpbmcgdGhlIHdpZGdldCBhbmQgZm9jdXNpbmcgaXRcblx0ICovXG5cdHB1YmxpYyBzZWFyY2hLZXliaW5kaW5nSGFuZGxlcigpOiB2b2lkIHtcblx0XHR0aGlzLnNob3dXaWRnZXQoKTtcblx0XHR0aGlzLnNlYXJjaFR5cGUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50Py5jbGFzc0xpc3QuY29udGFpbnMoXCJhc2NpaVwiKSA/IFwiYXNjaWlcIiA6IFwiaGV4XCI7XG5cdFx0Y29uc3QgZGF0YVR5cGVTZWxlY3QgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXRhLXR5cGVcIikgYXMgSFRNTFNlbGVjdEVsZW1lbnQpO1xuXHRcdGRhdGFUeXBlU2VsZWN0LnZhbHVlID0gdGhpcy5zZWFyY2hUeXBlO1xuXHRcdC8vIFdlIGhhdmUgdG8gZ2V0IGFuZCB0aGVuIHNldCB0aGUgc3RhdGUgYXMgdGhpcyBkaXNwYXRjaCBldmVudCBhcHBlYXJzIHRvIGNsZWFyIHRoZSB3ZWJ2aWV3IHN0YXRlXG5cdFx0ZGF0YVR5cGVTZWxlY3QuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJjaGFuZ2VcIikpO1xuXHRcdHRoaXMuZmluZFRleHRCb3guZm9jdXMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gQWRkcyBhbiB3YXJuaW5nIC8gZXJyb3IgbWVzc2FnZSB0byB0aGUgaW5wdXQgYm94IHBhc3NlZCBpblxuXHQgKiBAcGFyYW0ge1wiZmluZFwiIHwgXCJyZXBsYWNlXCJ9IGlucHV0Qm94TmFtZSBXaGV0aGVyIGl0J3MgdGhlIGZpbmQgaW5wdXQgYm94IG9yIHRoZSByZXBsYWNlIGlucHV0IGJveFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBkaXNwbGF5XG5cdCAqIEBwYXJhbSB7XCJlcnJvclwiIHwgXCJ3YXJuaW5nXCJ9IHR5cGUgV2hldGhlciBpdCdzIGFuIGVycm9yIG1lc3NhZ2Ugb3IgYSB3YXJuaW5nIG1lc3NhZ2Vcblx0ICovXG5cdHByaXZhdGUgYWRkSW5wdXRNZXNzYWdlKGlucHV0Qm94TmFtZTogXCJmaW5kXCIgfCBcInJlcGxhY2VcIiwgbWVzc2FnZTogc3RyaW5nLCB0eXBlOiBcImVycm9yXCIgfCBcIndhcm5pbmdcIik6IHZvaWQge1xuXHRcdGNvbnN0IGlucHV0Qm94OiBIVE1MSW5wdXRFbGVtZW50ID0gaW5wdXRCb3hOYW1lID09PSBcImZpbmRcIiA/IHRoaXMuZmluZFRleHRCb3ggOiB0aGlzLnJlcGxhY2VUZXh0Qm94O1xuXHRcdGNvbnN0IG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgJHtpbnB1dEJveE5hbWV9LW1lc3NhZ2UtYm94YCkgYXMgSFRNTERpdkVsZW1lbnQ7XG5cdFx0Ly8gV2UgdHJ5IHRvIGRvIHRoZSBsZWFzdCBhbW91bnQgb2YgRE9NIGNoYW5naW5nIGFzIHRvIHJlZHVjZSB0aGUgZmxhc2hpbmcgdGhlIHVzZXIgc2Vlc1xuXHRcdGlmIChtZXNzYWdlQm94LmlubmVyVGV4dCA9PT0gbWVzc2FnZSAmJiBtZXNzYWdlQm94LmNsYXNzTGlzdC5jb250YWlucyhgaW5wdXQtJHt0eXBlfWApKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIGlmIChtZXNzYWdlQm94LmNsYXNzTGlzdC5jb250YWlucyhgaW5wdXQtJHt0eXBlfWApKSB7XG5cdFx0XHRtZXNzYWdlQm94LmlubmVyVGV4dCA9IG1lc3NhZ2U7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucmVtb3ZlSW5wdXRNZXNzYWdlKFwiZmluZFwiLCB0cnVlKTtcblx0XHRcdG1lc3NhZ2VCb3guaW5uZXJUZXh0ID0gbWVzc2FnZTtcblx0XHRcdC8vIEFkZCB0aGUgY2xhc3NlcyBmb3IgcHJvcGVyIHN0eWxpbmcgb2YgdGhlIG1lc3NhZ2Vcblx0XHRcdGlucHV0Qm94LmNsYXNzTGlzdC5hZGQoYCR7dHlwZX0tYm9yZGVyYCk7XG5cdFx0XHRtZXNzYWdlQm94LmNsYXNzTGlzdC5hZGQoYCR7dHlwZX0tYm9yZGVyYCwgYGlucHV0LSR7dHlwZX1gKTtcblx0XHRcdG1lc3NhZ2VCb3guaGlkZGVuID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBSZW1vdmVzIHRoZSB3YXJuaW5nIC8gZXJyb3IgbWVzc2FnZVxuXHQgKiBAcGFyYW0ge1wiZmluZFwiIHwgXCJyZXBsYWNlXCJ9IGlucHV0Qm94TmFtZSBXaGljaCBpbnB1dCBib3ggdG8gcmVtb3ZlIHRoZSBtZXNzYWdlIGZyb21cblx0ICogQHBhcmFtIHtib29sZWFuIHwgdW5kZWZpbmVkfSBza2lwSGlkaW5nIFdoZXRoZXIgd2Ugd2FudCB0byBza2lwIGhpZGluZyB0aGUgZW1wdHkgbWVzc2FnZSBib3gsIHRoaXMgaXMgdXNlZnVsIGZvciBjbGVhcmluZyB0aGUgYm94IHRvIGFkZCBuZXcgdGV4dFxuXHQgKi9cblx0cHJpdmF0ZSByZW1vdmVJbnB1dE1lc3NhZ2UoaW5wdXRCb3hOYW1lOiBcImZpbmRcIiB8IFwicmVwbGFjZVwiLCBza2lwSGlkaW5nPzogYm9vbGVhbik6IHZvaWQge1xuXHRcdGNvbnN0IGlucHV0Qm94OiBIVE1MSW5wdXRFbGVtZW50ID0gaW5wdXRCb3hOYW1lID09PSBcImZpbmRcIiA/IHRoaXMuZmluZFRleHRCb3ggOiB0aGlzLnJlcGxhY2VUZXh0Qm94O1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGAke2lucHV0Qm94TmFtZX0tbWVzc2FnZS1ib3hgKSBhcyBIVE1MRGl2RWxlbWVudDtcblx0XHQvLyBBZGQgdGhlIGNsYXNzZXMgZm9yIHByb3BlciBzdHlsaW5nIG9mIHRoZSBtZXNzYWdlXG5cdFx0aW5wdXRCb3guY2xhc3NMaXN0LnJlbW92ZShcImVycm9yLWJvcmRlclwiLCBcIndhcm5pbmctYm9yZGVyXCIpO1xuXHRcdGVycm9yTWVzc2FnZUJveC5jbGFzc0xpc3QucmVtb3ZlKFwiZXJyb3ItYm9yZGVyXCIsIFwid2FybmluZy1ib3JkZXJcIiwgXCJpbnB1dC13YXJuaW5nXCIsIFwiaW5wdXQtZXJyb3JcIik7XG5cdFx0aWYgKHNraXBIaWRpbmcgIT09IHRydWUpIGVycm9yTWVzc2FnZUJveC5oaWRkZW4gPSB0cnVlO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBSZXZlYWxzIHRoZSBmaW5kIHdpZGdldCwgc2ltaWxhciB0byBob3cgdGhlIGRlZmF1bHQgZWRpdG9yIGRvZXMgaXRcblx0ICovXG5cdHByaXZhdGUgc2hvd1dpZGdldCgpOiB2b2lkIHtcblx0XHQvLyBEb24ndCB0cmlnZ2VyIHRoZSBzaG93IGFuaW1hdGlvbiBhZ2FpbiBpZiBpdCdzIGFscmVhZHkgc2hvd25cblx0XHRpZiAodGhpcy5zZWFyY2hDb250YWluZXIuc3R5bGUuZGlzcGxheSA9PT0gXCJibG9ja1wiKSByZXR1cm47XG5cdFx0dGhpcy5zZWFyY2hDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblx0XHRsZXQgY3VycmVudFRvcCA9IC04NTtcblx0XHRjb25zdCBmcmFtZUludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKGN1cnJlbnRUb3AgPT09IC00KSB7XG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwoZnJhbWVJbnRlcnZhbCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjdXJyZW50VG9wKys7XG5cdFx0XHRcdHRoaXMuc2VhcmNoQ29udGFpbmVyLnN0eWxlLnRvcCA9IGAke2N1cnJlbnRUb3B9cHhgO1xuXHRcdFx0fVxuXHRcdH0sIDMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBIaWRlcyB0aGUgZmluZCB3aWRnZXQsIHNpbWlsYXIgdG8gaG93IHRoZSBkZWZhdWx0IGVkaXRvciBkb2VzIGl0XG5cdCAqL1xuXHRwcml2YXRlIGhpZGVXaWRnZXQoKTogdm9pZCB7XG5cdFx0bGV0IGN1cnJlbnRUb3AgPSAtNDtcblx0XHRjb25zdCBmcmFtZUludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKGN1cnJlbnRUb3AgPT09IC04NSkge1xuXHRcdFx0XHR0aGlzLnNlYXJjaENvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwoZnJhbWVJbnRlcnZhbCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjdXJyZW50VG9wLS07XG5cdFx0XHRcdHRoaXMuc2VhcmNoQ29udGFpbmVyLnN0eWxlLnRvcCA9IGAke2N1cnJlbnRUb3B9cHhgO1xuXHRcdFx0fVxuXHRcdH0sIDMpO1xuXHR9XG59XG4iLCAiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IEJ5dGVEYXRhIH0gZnJvbSBcIi4vYnl0ZURhdGFcIjtcbmltcG9ydCB7IG1lc3NhZ2VIYW5kbGVyIH0gZnJvbSBcIi4vaGV4RWRpdFwiO1xuXG4vLyBDbGFzcyByZXNwb25zaWJsZSBmb3Igbm90aWZ5aW5nIHRoZSBkYXRhIGluc3BlY3RvciB2aWV3IG9mIHRoZSBuZWNlc3NhcnkgZWRpdG9yIGluZm9ybWF0aW9uXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRGF0YUluc3BlY3RvckhhbmRsZXIge1xuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gU2VuZHMgYSBtZXNzYWdlIHRvIHRoZSBleHQgaG9zdCAtPiBkYXRhIGluc3BlY3RvciB2aWV3IHRvIG5vdGlmeSB0aGUgaW5zcGVjdG9yIHRvIGNsZWFyXG5cdCAqL1xuXHRwdWJsaWMgc3RhdGljIGNsZWFySW5zcGVjdG9yKCk6IHZvaWQge1xuXHRcdG1lc3NhZ2VIYW5kbGVyLnBvc3RNZXNzYWdlKFwiZGF0YUluc3BlY3RvclwiLCB7XG5cdFx0XHRtZXRob2Q6IFwiY2xlYXJcIlxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBTZW5kcyB0aGUgc2VsZWN0ZWQgYnl0ZXMgdG8gdGhlIGluc3BlY3RvciB2aWV3IHRvIHVwZGF0ZSBpdFxuXHQgKiBAcGFyYW0gYnl0ZV9vYmogVGhlIGJ5dGVkYXRhIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHNlbGVjdGVkIGJ5dGVzXG5cdCAqL1xuXHRwdWJsaWMgc3RhdGljIHVwZGF0ZUluc3BlY3RvcihieXRlX29iajogQnl0ZURhdGEpOiB2b2lkIHtcblx0XHRtZXNzYWdlSGFuZGxlci5wb3N0TWVzc2FnZShcImRhdGFJbnNwZWN0b3JcIiwge1xuXHRcdFx0bWV0aG9kOiBcInVwZGF0ZVwiLFxuXHRcdFx0Ynl0ZURhdGE6IGJ5dGVfb2JqLFxuXHRcdH0pO1xuXHR9XG59IiwgIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG5cbmltcG9ydCB7IEJ5dGVEYXRhIH0gZnJvbSBcIi4vYnl0ZURhdGFcIjtcbmltcG9ydCB7IGdldEVsZW1lbnRzV2l0aEdpdmVuT2Zmc2V0LCB1cGRhdGVBc2NpaVZhbHVlLCBwYWQsIGNyZWF0ZU9mZnNldFJhbmdlLCByZXRyaWV2ZVNlbGVjdGVkQnl0ZU9iamVjdCwgZ2V0RWxlbWVudHNPZmZzZXQsIGdldEVsZW1lbnRzQ29sdW1uLCBpc01hYyB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCB7IHRvZ2dsZUhvdmVyIH0gZnJvbSBcIi4vZXZlbnRIYW5kbGVyc1wiO1xuaW1wb3J0IHsgY2h1bmtIYW5kbGVyLCB2aXJ0dWFsSGV4RG9jdW1lbnQgfSBmcm9tIFwiLi9oZXhFZGl0XCI7XG5pbXBvcnQgeyBTY3JvbGxCYXJIYW5kbGVyIH0gZnJvbSBcIi4vc2Nyb2xsQmFySGFuZGxlclwiO1xuaW1wb3J0IHsgRWRpdEhhbmRsZXIsIEVkaXRNZXNzYWdlIH0gZnJvbSBcIi4vZWRpdEhhbmRsZXJcIjtcbmltcG9ydCB7IFdlYnZpZXdTdGF0ZU1hbmFnZXIgfSBmcm9tIFwiLi93ZWJ2aWV3U3RhdGVNYW5hZ2VyXCI7XG5pbXBvcnQgeyBTZWxlY3RIYW5kbGVyIH0gZnJvbSBcIi4vc2VsZWN0SGFuZGxlclwiO1xuaW1wb3J0IHsgU2VhcmNoSGFuZGxlciB9IGZyb20gXCIuL3NlYXJjaEhhbmRsZXJcIjtcbmltcG9ydCB7IERhdGFJbnNwZWN0b3JIYW5kbGVyIH0gZnJvbSBcIi4vZGF0YUluc3BlY3RvckhhbmRsZXJcIjtcblxuZXhwb3J0IGludGVyZmFjZSBWaXJ0dWFsaXplZFBhY2tldCB7XG5cdG9mZnNldDogbnVtYmVyO1xuXHRkYXRhOiBCeXRlRGF0YTtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB0aGUgcHJlc2VudGF0aW9uIGxheWVyIHZpcnR1YWxpemluZyB0aGUgaGV4IGRvY3VtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBWaXJ0dWFsRG9jdW1lbnQge1xuXHRwcml2YXRlIGZpbGVTaXplOiBudW1iZXI7XG5cdHByaXZhdGUgYmFzZUFkZHJlc3M6IG51bWJlcjtcblx0cHJpdmF0ZSByb3dIZWlnaHQ6IG51bWJlcjtcblx0cHVibGljIHJlYWRvbmx5IGRvY3VtZW50SGVpZ2h0OiBudW1iZXI7XG5cdHByaXZhdGUgdmlld1BvcnRIZWlnaHQhOiBudW1iZXJcblx0cHJpdmF0ZSByZWFkb25seSBzY3JvbGxCYXJIYW5kbGVyOiBTY3JvbGxCYXJIYW5kbGVyO1xuXHRwcml2YXRlIHJlYWRvbmx5IGVkaXRIYW5kbGVyOiBFZGl0SGFuZGxlcjtcblx0cHJpdmF0ZSByZWFkb25seSBzZWxlY3RIYW5kbGVyOiBTZWxlY3RIYW5kbGVyO1xuXHRwcml2YXRlIHJlYWRvbmx5IHNlYXJjaEhhbmRsZXI6IFNlYXJjaEhhbmRsZXI7XG5cdHByaXZhdGUgcm93czogTWFwPHN0cmluZywgSFRNTERpdkVsZW1lbnQ+W107XG5cdHByaXZhdGUgcmVhZG9ubHkgZWRpdG9yQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIENvbnN0cnVjdHMgYSBWaXJ0dWFsRG9jdW1lbnQgZm9yIGEgZmlsZSBvZiBhIGdpdmVuIHNpemUuIEFsc28gaGFuZGxlcyB0aGUgaW5pdGlhbCBET00gbGF5b3V0XG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBmaWxlU2l6ZSBUaGUgc2l6ZSwgaW4gYnl0ZXMsIG9mIHRoZSBmaWxlIHdoaWNoIGlzIGJlaW5nIGRpc3BsYXllZFxuXHQgKi9cblx0Y29uc3RydWN0b3IoZmlsZVNpemU6IG51bWJlciwgZWRpdG9yRm9udFNpemU6IG51bWJlciwgYmFzZUFkZHJlc3MgPSAwKSB7XG5cdFx0dGhpcy5maWxlU2l6ZSA9IGZpbGVTaXplO1xuXHRcdHRoaXMuYmFzZUFkZHJlc3MgPSBiYXNlQWRkcmVzcztcblx0XHR0aGlzLmVkaXRIYW5kbGVyID0gbmV3IEVkaXRIYW5kbGVyKCk7XG5cdFx0dGhpcy5zZWxlY3RIYW5kbGVyID0gbmV3IFNlbGVjdEhhbmRsZXIoKTtcblx0XHR0aGlzLnNlYXJjaEhhbmRsZXIgPSBuZXcgU2VhcmNoSGFuZGxlcigpO1xuXHRcdC8vIENyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgZWRpdG9yIGNvbnRhaW5lci4gVGhpcyBpcyB1c2VmdWwgZm9yIGV2ZW50IGxpc3RlbmVyc1xuXHRcdHRoaXMuZWRpdG9yQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0b3ItY29udGFpbmVyXCIpITtcblx0XHQvLyBUaGUgaGVpZ2h0IG9mIGVhY2ggcm93IG11c3QgcmVzcGVjdCB0aGUgZm9udCBzaXplIHNldHRpbmcgdG8gc2NhbGUgbmljZWx5XG5cdFx0dGhpcy5yb3dIZWlnaHQgPSBlZGl0b3JGb250U2l6ZSAqIDI7XG5cdFx0KGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJoZWFkZXJcIilbMl0gYXMgSFRNTEVsZW1lbnQpLnN0eWxlLndpZHRoID0gXCIxNnJlbVwiO1xuXHRcdHRoaXMuZG9jdW1lbnRIZWlnaHQgPSA1MDAwMDA7XG5cdFx0dGhpcy5yb3dzID0gW107XG5cblx0XHQvLyBJbml0aWFsIHJvdyBob2xkZXJzIGZvciB0aGUgdGhyZWUgY29sdW1uc1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG5cdFx0XHR0aGlzLnJvd3MucHVzaChuZXcgTWFwPHN0cmluZywgSFRNTERpdkVsZW1lbnQ+KCkpO1xuXHRcdH1cblxuXHRcdC8vIFRoZSBsZWZ0bW9zdCBjb2x1bW4gaXMgYSBsaXR0bGUgc3BlY2lhbCBzbyB3ZSBzZXQgaXQgdXAgYSBsaXR0bGUgZGlmZmVyZW50bHlcblx0XHQvLyBTaW5jZSBlYWNoIHJvdyBpcyBzZXQgYWJzb2x1dGVseSB0aGV5IGFyZSBwdWxsZWQgb3V0IG9mIHRoZSBmbG93IG9mIHRoZSBwYWdlLiBUaGVcblx0XHQvLyBoZWFkZXIncyB0ZXh0IChpbmFjY2Vzc2libGUpIGlzIFwiMDAwMDAwMDBcIiB0byBtYXRjaCB0aGUgbW9ub3NwYWNlIGxlbmd0aCBvZiB0aGUgd2hvbGVcblx0XHQvLyBjb2x1bW4sIHNvIHRoYXQgdGhpcyBjYW4gYmUgdXNlZCB0byBzZXQgdGhlIGNvbHVtbidzIHdpZHRoIHJlZ2FyZGxlc3Mgb2YgY29uZmlndXJlZCB6b29tXG5cdFx0Ly8gbGV2ZWwgb3IgZm9udCBzaXplXG5cdFx0Y29uc3QgaGVhZGVySGVpZ2h0ID0gKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJoZWFkZXJcIilbMF0gYXMgSFRNTEVsZW1lbnQpLm9mZnNldEhlaWdodDtcblx0XHQoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImhlYWRlclwiKVswXSBhcyBIVE1MRWxlbWVudCkuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG5cdFx0Ly8gVGhlIHBsdXMgb25lIGlzIHRvIGFjY291bnQgZm9yIGFsbCBvdGhlciBoZWFkZXJzIGhhdmluZyBib3JkZXJzXG5cdFx0KGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJoZWFkZXJcIilbMF0gYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmhlaWdodCA9IGAke2hlYWRlckhlaWdodCArIDF9cHhgO1xuXG5cdFx0Ly8gQ3JlYXRlcyB0aGUgc2Nyb2xsQmFyIEhhbmRsZXJcblx0XHR0aGlzLnNjcm9sbEJhckhhbmRsZXIgPSBuZXcgU2Nyb2xsQmFySGFuZGxlcihcInNjcm9sbGJhclwiLCB0aGlzLmZpbGVTaXplIC8gMTYsIHRoaXMucm93SGVpZ2h0KTtcblx0XHQvLyBJbnRpYWxpemVzIGEgZmV3IHRoaW5ncyBzdWNoIGFzIHZpZXdwb3J0IHNpemUgYW5kIHRoZSBzY3JvbGxiYXIgcG9zaXRpb25zXG5cdFx0dGhpcy5kb2N1bWVudFJlc2l6ZSgpO1xuXHRcdHRoaXMuYmluZEV2ZW50TGlzdGVuZXJzKCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJlbmRlcnMgdGhlIG5ld2x5IHByb3ZpZGVkIHBhY2tldHMgb250byB0aGUgRE9NXG5cdCAqIEBwYXJhbSB7VmlydHVhbGl6ZWRQYWNrZXRbXX0gbmV3UGFja2V0cyB0aGUgcGFja2V0cyB3aGljaCB3aWxsIGJlIHJlbmRlcmVkXG5cdCAqL1xuXHRwdWJsaWMgcmVuZGVyKG5ld1BhY2tldHM6IFZpcnR1YWxpemVkUGFja2V0W10pOiB2b2lkIHtcblx0XHRsZXQgcm93RGF0YTogVmlydHVhbGl6ZWRQYWNrZXRbXSA9IFtdO1xuXHRcdGNvbnN0IGFkZHJGcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRjb25zdCBoZXhGcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRjb25zdCBhc2NpaUZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdC8vIENvbnN0cnVjdCByb3dzIG9mIDE2IGFuZCBhZGQgdGhlbSB0byB0aGUgYXNzb2NpYXRlZCBmcmFnbWVudHNcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5ld1BhY2tldHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHJvd0RhdGEucHVzaChuZXdQYWNrZXRzW2ldKTtcblx0XHRcdGlmIChpID09PSBuZXdQYWNrZXRzLmxlbmd0aCAtIDEgfHwgcm93RGF0YS5sZW5ndGggPT0gMTYpIHtcblx0XHRcdFx0aWYgKCF0aGlzLnJvd3NbMF0uZ2V0KHJvd0RhdGFbMF0ub2Zmc2V0LnRvU3RyaW5nKCkpKSB7XG5cdFx0XHRcdFx0dGhpcy5wb3B1bGF0ZUhleEFkcmVzc2VzKGFkZHJGcmFnbWVudCwgcm93RGF0YSk7XG5cdFx0XHRcdFx0dGhpcy5wb3B1bGF0ZUhleEJvZHkoaGV4RnJhZ21lbnQsIHJvd0RhdGEpO1xuXHRcdFx0XHRcdHRoaXMucG9wdWxhdGVBc2NpaVRhYmxlKGFzY2lpRnJhZ21lbnQsIHJvd0RhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJvd0RhdGEgPSBbXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBSZW5kZXIgdGhlIGZyYWdtZW50cyB0byB0aGUgRE9NXG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZXhhZGRyXCIpPy5hcHBlbmRDaGlsZChhZGRyRnJhZ21lbnQpO1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGV4Ym9keVwiKT8uYXBwZW5kQ2hpbGQoaGV4RnJhZ21lbnQpO1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXNjaWlcIik/LmFwcGVuZENoaWxkKGFzY2lpRnJhZ21lbnQpO1xuXG5cdFx0aWYgKFdlYnZpZXdTdGF0ZU1hbmFnZXIuZ2V0U3RhdGUoKSkge1xuXHRcdFx0Y29uc3Qgc2VsZWN0ZWRPZmZzZXRzID0gdGhpcy5zZWxlY3RIYW5kbGVyLmdldFNlbGVjdGVkKCk7XG5cdFx0XHRpZiAoc2VsZWN0ZWRPZmZzZXRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0dGhpcy5zZWxlY3RIYW5kbGVyLnNldFNlbGVjdGVkKHNlbGVjdGVkT2Zmc2V0cywgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBUaGlzIGlzbid0IHRoZSBiZXN0IHBsYWNlIGZvciB0aGlzLCBidXQgaXQgY2FuJ3QgZ28gaW4gdGhlIGNvbnN0cnVjdG9yIGR1ZSB0byB0aGUgZG9jdW1lbnQgbm90IGJlaW5nIGluc3RhbnRpYXRlZCB5ZXRcblx0XHRcdC8vIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBzcm9sbFRvcCBpcyB0aGUgc2FtZSBhcyBpbiB0aGUgc3RhdGUgb2JqZWN0LCBzaG91bGQgb25seSBiZSBvdXQgb2Ygc3luYyBvbiBpbml0aWFsIHdlYnZpZXcgbG9hZFxuXHRcdFx0Y29uc3Qgc2F2ZWRTY3JvbGxUb3AgPSBXZWJ2aWV3U3RhdGVNYW5hZ2VyLmdldFN0YXRlKCkuc2Nyb2xsX3RvcDtcblx0XHRcdGlmIChzYXZlZFNjcm9sbFRvcCAmJiBzYXZlZFNjcm9sbFRvcCAhPT0gdGhpcy5zY3JvbGxCYXJIYW5kbGVyLnZpcnR1YWxTY3JvbGxUb3ApIHtcblx0XHRcdFx0dGhpcy5zY3JvbGxCYXJIYW5kbGVyLnJlc3luY1Njcm9sbFBvc2l0aW9uKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBCaW5kcyBhbGwgdGhlIGV2ZW50IGxpc3RlbmVycyB3aGljaCBhcHBseSB0byB0aGUgdmlydHVhbCBkb2N1bWVudFxuXHQgKi9cblx0cHJpdmF0ZSBiaW5kRXZlbnRMaXN0ZW5lcnMoKTogdm9pZCB7XG5cdFx0Ly8gQmluZCB0aGUgZXZlbnQgbGlzdGVuZXJzXG5cdFx0dGhpcy5lZGl0b3JDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5lZGl0b3JLZXlCb2FyZEhhbmRsZXIuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lZGl0b3JDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLCB0b2dnbGVIb3Zlcik7XG5cdFx0dGhpcy5lZGl0b3JDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbGVhdmVcIiwgdG9nZ2xlSG92ZXIpO1xuXG5cdFx0Ly8gRXZlbnQgaGFuZGxlcyB0byBoYW5kbGUgd2hlbiB0aGUgdXNlciBkcmFncyB0byBjcmVhdGUgYSBzZWxlY3Rpb25cblx0XHR0aGlzLmVkaXRvckNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jbGlja0hhbmRsZXIuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lZGl0b3JDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLm1vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG5cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNvcHlcIiwgKGV2ZW50OiBFdmVudCkgPT4ge1xuXHRcdFx0aWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ/LmNsYXNzTGlzdC5jb250YWlucyhcImhleFwiKSB8fCBkb2N1bWVudC5hY3RpdmVFbGVtZW50Py5jbGFzc0xpc3QuY29udGFpbnMoXCJhc2NpaVwiKSkge1xuXHRcdFx0XHR0aGlzLmVkaXRIYW5kbGVyLmNvcHkoZXZlbnQgYXMgQ2xpcGJvYXJkRXZlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgKGV2ZW50OiBFdmVudCkgPT4ge1xuXHRcdFx0aWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ/LmNsYXNzTGlzdC5jb250YWlucyhcImhleFwiKSB8fCBkb2N1bWVudC5hY3RpdmVFbGVtZW50Py5jbGFzc0xpc3QuY29udGFpbnMoXCJhc2NpaVwiKSkge1xuXHRcdFx0XHR0aGlzLmVkaXRIYW5kbGVyLnBhc3RlKGV2ZW50IGFzIENsaXBib2FyZEV2ZW50KTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLmRvY3VtZW50UmVzaXplLmJpbmQodGhpcykpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLndpbmRvd0tleWJvYXJkSGFuZGxlci5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gRXZlbnQgaGFuZGxlciB3aGljaCBpcyBjYWxsZWQgZXZlcnl0aW1lIHRoZSB2aWV3cG9ydCBpcyByZXNpemVkXG5cdCAqL1xuXHRwcml2YXRlIGRvY3VtZW50UmVzaXplKCk6IHZvaWQge1xuXHRcdHRoaXMudmlld1BvcnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuXHRcdGlmICh0aGlzLnNjcm9sbEJhckhhbmRsZXIpIHtcblx0XHRcdHRoaXMuc2Nyb2xsQmFySGFuZGxlci51cGRhdGVTY3JvbGxCYXIodGhpcy5maWxlU2l6ZSAvIDE2KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEdldHMgdGhlIG9mZnNldCBvZiB0aGUgcGFja2V0IGF0IHRoZSB0b3Agb2YgdGhlIHZpZXdwb3J0XG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBvZmZzZXRcblx0ICovXG5cdHB1YmxpYyB0b3BPZmZzZXQoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3IodGhpcy5zY3JvbGxCYXJIYW5kbGVyLnZpcnR1YWxTY3JvbGxUb3AgLyB0aGlzLnJvd0hlaWdodCkgKiAxNik7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEdldHMgdGhlIG9mZnNldCBvZiB0aGUgcGFja2V0IGF0IHRoZSBib3R0b20gcmlnaHQgb2YgdGhlIHZpZXdwb3J0XG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBvZmZzZXRcblx0ICovXG5cdHB1YmxpYyBib3R0b21PZmZzZXQoKTogbnVtYmVyIHtcblx0XHRjb25zdCBjbGllbnRIZWlnaHQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImh0bWxcIilbMF0uY2xpZW50SGVpZ2h0O1xuXHRcdGNvbnN0IG51bVJvd3NJblZpZXdwb3J0ID0gTWF0aC5mbG9vcihjbGllbnRIZWlnaHQgLyB0aGlzLnJvd0hlaWdodCk7XG5cdFx0Ly8gSWYgaXQncyB0aGUgZW5kIG9mIHRoZSBmaWxlIGl0IHdpbGwgZmFsbCB0byB0aGUgdGhpcy5maWxlU2l6ZSAtIDEgY2FzZVxuXHRcdHJldHVybiBNYXRoLm1pbigodGhpcy50b3BPZmZzZXQoKSArIChudW1Sb3dzSW5WaWV3cG9ydCAqIDE2KSkgLSAxLCB0aGlzLmZpbGVTaXplIC0gMSk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJldHJpZXZlcyB0aGUgWSBwb3NpdGlvbiBhIGdpdmVuIG9mZnNldCBpcyBhdFxuXHQgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IFRoZSBvZmZzZXQgdG8gY2FsY3VsYXRlIHRoZSB5IHBvc2l0aW9uIG9mXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBZIHBvc2l0aW9uIHRoZSBvZmZzZXQgaXMgYXRcblx0ICovXG5cdHB1YmxpYyBvZmZzZXRZUG9zKG9mZnNldDogbnVtYmVyKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3Iob2Zmc2V0IC8gMTYpICogdGhpcy5yb3dIZWlnaHQpICUgdGhpcy5kb2N1bWVudEhlaWdodDtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gR2V0cyBleGVjdXRlZCBldmVyeXRpbWUgdGhlIGRvY3VtZW50IGlzIHNjcm9sbGVkLCB0aGlzIHRhbGtzIHRvIHRoZSBkYXRhIGxheWVyIHRvIHJlcXVlc3QgbW9yZSBwYWNrZXRzXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgc2Nyb2xsSGFuZGxlcigpOiBQcm9taXNlPHZvaWRbXT4ge1xuXHRcdC8vIFdlIHdhbnQgdG8gZW5zdXJlIHRoZXJlIGFyZSBhdCBsZWFzdCAyIGNodW5rcyBhYm92ZSB1cyBhbmQgNCBjaHVua3MgYmVsb3cgdXNcblx0XHQvLyBUaGVzZSBudW1iZXJzIHdlcmUgY2hvc2VuIGFyYml0cmFyaWx5IHVuZGVyIHRoZSBhc3N1bXB0aW9uIHRoYXQgc2Nyb2xsaW5nIGRvd24gaXMgbW9yZSBjb21tb25cblx0XHRjb25zdCBjaHVua0hhbmRsZXJSZXNwb25zZSA9IGF3YWl0IGNodW5rSGFuZGxlci5lbnN1cmVCdWZmZXIodmlydHVhbEhleERvY3VtZW50LnRvcE9mZnNldCgpLCB7XG5cdFx0XHR0b3BCdWZmZXJTaXplOiAyLFxuXHRcdFx0Ym90dG9tQnVmZmVyU2l6ZTogNFxuXHRcdH0pO1xuXHRcdGNvbnN0IHJlbW92ZWRDaHVua3M6IG51bWJlcltdID0gY2h1bmtIYW5kbGVyUmVzcG9uc2UucmVtb3ZlZDtcblx0XHQvLyBXZSByZW1vdmUgdGhlIGNodW5rcyBmcm9tIHRoZSBET00gYXMgdGhlIGNodW5rIGhhbmRsZXIgaXMgbm8gbG9uZ2VyIHRyYWNraW5nIHRoZW1cblx0XHRmb3IgKGNvbnN0IGNodW5rIG9mIHJlbW92ZWRDaHVua3MpIHtcblx0XHRcdGZvciAobGV0IGkgPSBjaHVuazsgaSA8IGNodW5rICsgY2h1bmtIYW5kbGVyLmNodW5rU2l6ZTsgaSArPSAxNikge1xuXHRcdFx0XHR0aGlzLnJvd3NbMF0uZ2V0KGkudG9TdHJpbmcoKSk/LnJlbW92ZSgpO1xuXHRcdFx0XHR0aGlzLnJvd3NbMF0uZGVsZXRlKGkudG9TdHJpbmcoKSk7XG5cdFx0XHRcdHRoaXMucm93c1sxXS5nZXQoaS50b1N0cmluZygpKT8ucmVtb3ZlKCk7XG5cdFx0XHRcdHRoaXMucm93c1sxXS5kZWxldGUoaS50b1N0cmluZygpKTtcblx0XHRcdFx0dGhpcy5yb3dzWzJdLmdldChpLnRvU3RyaW5nKCkpPy5yZW1vdmUoKTtcblx0XHRcdFx0dGhpcy5yb3dzWzJdLmRlbGV0ZShpLnRvU3RyaW5nKCkpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gY2h1bmtIYW5kbGVyUmVzcG9uc2UucmVxdWVzdGVkO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBSZW5kZXJzIHRoZSBndXR0ZXIgd2hpY2ggaG9sZHMgdGhlIGhleCBhZGRyZXNzIG1lbW9yeSBvZmZzZXRcblx0ICogQHBhcmFtIHtEb2N1bWVudEZyYWdtZW50fSBmcmFnbWVudCBUaGUgZnJhZ21lbnQgd2hpY2ggZWxlbWVudHMgZ2V0IGFkZGVkIHRvXG5cdCAqIEBwYXJhbSB7VmlydHVhbGl6ZWRQYWNrZXRbXX0gcm93RGF0YSBBbiBhcnJheSBvZiAxNiBieXRlcyByZXByZXNlbnRpbmcgb25lIHJvd1xuXHQgKi9cblx0cHJpdmF0ZSBwb3B1bGF0ZUhleEFkcmVzc2VzKGZyYWdtZW50OiBEb2N1bWVudEZyYWdtZW50LCByb3dEYXRhOiBWaXJ0dWFsaXplZFBhY2tldFtdKTogdm9pZCB7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gcm93RGF0YVswXS5vZmZzZXQ7XG5cdFx0Y29uc3QgYWRkciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0Y29uc3QgZGlzcGxheU9mZnNldCA9IG9mZnNldCArIHRoaXMuYmFzZUFkZHJlc3M7XG5cdFx0YWRkci5jbGFzc05hbWUgPSBcInJvd1wiO1xuXHRcdGFkZHIuc2V0QXR0cmlidXRlKFwiZGF0YS1vZmZzZXRcIiwgb2Zmc2V0LnRvU3RyaW5nKCkpO1xuXHRcdGFkZHIuaW5uZXJUZXh0ID0gcGFkKGRpc3BsYXlPZmZzZXQudG9TdHJpbmcoMTYpLCA4KS50b1VwcGVyQ2FzZSgpO1xuXHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGFkZHIpO1xuXHRcdHRoaXMucm93c1swXS5zZXQob2Zmc2V0LnRvU3RyaW5nKCksIGFkZHIpO1xuXHRcdHRoaXMudHJhbnNsYXRlUm93KGFkZHIsIG9mZnNldCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJlbmRlcnMgdGhlIGRlY29kZWQgdGV4dCBzZWN0aW9uXG5cdCAqIEBwYXJhbSB7RG9jdW1lbnRGcmFnbWVudH0gZnJhZ21lbnQgVGhlIGZyYWdtZW50IHdoaWNoIGVsZW1lbnRzIGdldCBhZGRlZCB0b1xuXHQgKiBAcGFyYW0ge1ZpcnR1YWxpemVkUGFja2V0W119IHJvd0RhdGEgQW4gYXJyYXkgb2YgMTYgYnl0ZXMgcmVwcmVzZW50aW5nIG9uZSByb3dcblx0ICovXG5cdHByaXZhdGUgcG9wdWxhdGVBc2NpaVRhYmxlKGZyYWdtZW50OiBEb2N1bWVudEZyYWdtZW50LCByb3dEYXRhOiBWaXJ0dWFsaXplZFBhY2tldFtdKTogdm9pZCB7XG5cdFx0Y29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRyb3cuY2xhc3NOYW1lID0gXCJyb3dcIjtcblx0XHRjb25zdCByb3dPZmZzZXQgPSByb3dEYXRhWzBdLm9mZnNldC50b1N0cmluZygpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgcm93RGF0YS5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgYXNjaWlfZWxlbWVudCA9IHRoaXMuY3JlYXRlQXNjaWlFbGVtZW50KHJvd0RhdGFbaV0pO1xuXHRcdFx0cm93LmFwcGVuZENoaWxkKGFzY2lpX2VsZW1lbnQpO1xuXHRcdH1cblx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChyb3cpO1xuXHRcdHRoaXMucm93c1syXS5zZXQocm93T2Zmc2V0LCByb3cpO1xuXHRcdHRoaXMudHJhbnNsYXRlUm93KHJvdywgcGFyc2VJbnQocm93T2Zmc2V0KSk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJlbmRlcnMgdGhlIGRlY29kZWQgdGV4dCBzZWN0aW9uXG5cdCAqIEBwYXJhbSB7RG9jdW1lbnRGcmFnbWVudH0gZnJhZ21lbnQgVGhlIGZyYWdtZW50IHdoaWNoIGVsZW1lbnRzIGdldCBhZGRlZCB0b1xuXHQgKiBAcGFyYW0ge1ZpcnR1YWxpemVkUGFja2V0W119IHJvd0RhdGEgQW4gYXJyYXkgb2YgMTYgYnl0ZXMgcmVwcmVzZW50aW5nIG9uZSByb3dcblx0ICovXG5cdHByaXZhdGUgcG9wdWxhdGVIZXhCb2R5KGZyYWdtZW50OiBEb2N1bWVudEZyYWdtZW50LCByb3dEYXRhOiBWaXJ0dWFsaXplZFBhY2tldFtdKTogdm9pZCB7XG5cdFx0Y29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRyb3cuY2xhc3NOYW1lID0gXCJyb3dcIjtcblx0XHRjb25zdCByb3dPZmZzZXQgPSByb3dEYXRhWzBdLm9mZnNldC50b1N0cmluZygpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgcm93RGF0YS5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgaGV4X2VsZW1lbnQgPSB0aGlzLmNyZWF0ZUhleEVsZW1lbnQocm93RGF0YVtpXSk7XG5cdFx0XHRyb3cuYXBwZW5kQ2hpbGQoaGV4X2VsZW1lbnQpO1xuXHRcdH1cblx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChyb3cpO1xuXHRcdHRoaXMucm93c1sxXS5zZXQocm93T2Zmc2V0LCByb3cpO1xuXHRcdHRoaXMudHJhbnNsYXRlUm93KHJvdywgcGFyc2VJbnQocm93T2Zmc2V0KSk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIENyZWF0ZXMgYSBzaW5nbGUgaGV4IHNwYW4gZWxlbWVudCBmcm9tIGEgcGFja2V0XG5cdCAqIEBwYXJhbSB7VmlydHVhbGl6ZWRQYWNrZXR9IHBhY2tldCBUaGUgVmlydHVhbGl6ZWRQYWNrZXQgaG9sZGluZyB0aGUgZGF0YSBuZWVkZWQgdG8gZ2VuZXJhdGUgdGhlIGVsZW1lbnRcblx0ICogQHJldHVybnMge0hUTUxTcGFuRWxlbWVudH0gVGhlIGh0bWwgc3BhbiBlbGVtZW50IHJlYWR5IHRvIGJlIGFkZGVkIHRvIHRoZSBET01cblx0ICovXG5cdHByaXZhdGUgY3JlYXRlSGV4RWxlbWVudChwYWNrZXQ6IFZpcnR1YWxpemVkUGFja2V0KTogSFRNTFNwYW5FbGVtZW50IHtcblx0XHRjb25zdCBoZXhfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuXHRcdGhleF9lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoZXhcIik7XG5cdFx0aGV4X2VsZW1lbnQuY2xhc3NMaXN0LmFkZChgY2VsbC1vZmZzZXQtJHtwYWNrZXQub2Zmc2V0LnRvU3RyaW5nKCl9YCk7XG5cdFx0Ly8gSWYgdGhlIG9mZnNldCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gZmlsZVNpemUgdGhhdCdzIG91ciBwbGFjZWhvbGRlciBzbyBpdCdzIGp1c3QgYSArIHN5bWJvbCB0byBzaWduYWwgeW91IGNhbiB0eXBlIGFuZCBhZGQgYnl0ZXMgdGhlcmVcblx0XHRpZiAocGFja2V0Lm9mZnNldCA8IHRoaXMuZmlsZVNpemUpIHtcblx0XHRcdGhleF9lbGVtZW50LmlubmVyVGV4dCA9IHBhZChwYWNrZXQuZGF0YS50b0hleCgpLCAyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aGV4X2VsZW1lbnQuY2xhc3NMaXN0LmFkZChcImFkZC1jZWxsXCIpO1xuXHRcdFx0aGV4X2VsZW1lbnQuaW5uZXJUZXh0ID0gXCIrXCI7XG5cdFx0fVxuXHRcdGhleF9lbGVtZW50LnRhYkluZGV4ID0gLTE7XG5cdFx0aGV4X2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbGVhdmVcIiwgdG9nZ2xlSG92ZXIpO1xuXHRcdHJldHVybiBoZXhfZWxlbWVudDtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gQ3JlYXRlcyBhIHNpbmdsZSBhc2NpaSBzcGFuIGVsZW1lbnQgZnJvbSBhIHBhY2tldFxuXHQgKiBAcGFyYW0ge1ZpcnR1YWxpemVkUGFja2V0fSBwYWNrZXQgVGhlIFZpcnR1YWxpemVkUGFja2V0IGhvbGRpbmcgdGhlIGRhdGEgbmVlZGVkIHRvIGdlbmVyYXRlIHRoZSBlbGVtZW50XG5cdCAqIEByZXR1cm5zIHtIVE1MU3BhbkVsZW1lbnR9IFRoZSBodG1sIHNwYW4gZWxlbWVudCByZWFkeSB0byBiZSBhZGRlZCB0byB0aGUgRE9NXG5cdCAqL1xuXHRwcml2YXRlIGNyZWF0ZUFzY2lpRWxlbWVudChwYWNrZXQ6IFZpcnR1YWxpemVkUGFja2V0KTogSFRNTFNwYW5FbGVtZW50IHtcblx0XHRjb25zdCBhc2NpaV9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG5cdFx0YXNjaWlfZWxlbWVudC5jbGFzc0xpc3QuYWRkKGBjZWxsLW9mZnNldC0ke3BhY2tldC5vZmZzZXQudG9TdHJpbmcoKX1gKTtcblx0XHRhc2NpaV9lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJhc2NpaVwiKTtcblx0XHQvLyBJZiB0aGUgb2Zmc2V0IGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBmaWxlU2l6ZSB0aGF0J3Mgb3VyIHBsYWNlaG9sZGVyIHNvIGl0J3MganVzdCBhICsgc3ltYm9sIHRvIHNpZ25hbCB5b3UgY2FuIHR5cGUgYW5kIGFkZCBieXRlcyB0aGVyZVxuXHRcdGlmIChwYWNrZXQub2Zmc2V0IDwgdGhpcy5maWxlU2l6ZSkge1xuXHRcdFx0dXBkYXRlQXNjaWlWYWx1ZShwYWNrZXQuZGF0YSwgYXNjaWlfZWxlbWVudCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFzY2lpX2VsZW1lbnQuY2xhc3NMaXN0LmFkZChcImFkZC1jZWxsXCIpO1xuXHRcdFx0YXNjaWlfZWxlbWVudC5pbm5lclRleHQgPSBcIitcIjtcblx0XHR9XG5cdFx0YXNjaWlfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2VsZWF2ZVwiLCB0b2dnbGVIb3Zlcik7XG5cdFx0YXNjaWlfZWxlbWVudC50YWJJbmRleCA9IC0xO1xuXHRcdHJldHVybiBhc2NpaV9lbGVtZW50O1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBNb3ZlcyB0aGUgcm93cyBmcm9tIHdoZXJlIHRoZXkgd2VyZSBwbGFjZWQgdG8gd2hlcmUgdGhleSBhcmUgc3VwcG9zZWQgdG8gYmUgKHRoaXMgaXMgZHVlIHRvIGFic29sdXRlIHBvc2l0aW9uaW5nKVxuXHQgKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSByb3cgIFRoZSBEaXZFbGVtZW50IHdoaWNoIG5lZWRzIHRvIGJlIG1vdmVkXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgVGhlIG9mZnNldCBvZiB0aGUgZWxlbWVudCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSByb3dcblx0ICovXG5cdHByaXZhdGUgdHJhbnNsYXRlUm93KHJvdzogSFRNTERpdkVsZW1lbnQsIG9mZnNldDogbnVtYmVyKTogdm9pZCB7XG5cdFx0Ly8gR2V0IHRoZSBleHBlY3RlZCBZIHZhbHVlXG5cdFx0Y29uc3QgZXhwZWN0ZWRZID0gdGhpcy5vZmZzZXRZUG9zKG9mZnNldCk7XG5cdFx0cm93LnN0eWxlLnRvcCA9IGAke2V4cGVjdGVkWX1weGA7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgdGhlIGNsaWNrIGV2ZW50cyB3aXRoaW4gdGhlIGVkaXRvclxuXHQgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFRoZSBNb3VzZUV2ZW50IHBhc3NlZCB0byB0aGUgZXZlbnQgaGFuZGxlci5cblx0ICovXG5cdHByaXZhdGUgY2xpY2tIYW5kbGVyKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG5cdFx0aWYgKGV2ZW50LmJ1dHRvbnMgPiAxKSByZXR1cm47XG5cdFx0Y29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuXHRcdGlmICghdGFyZ2V0IHx8IGlzTmFOKGdldEVsZW1lbnRzT2Zmc2V0KHRhcmdldCkpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLmVkaXRIYW5kbGVyLmNvbXBsZXRlUGVuZGluZ0VkaXRzKCk7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gZ2V0RWxlbWVudHNPZmZzZXQodGFyZ2V0KTtcblx0XHRpZiAoZXZlbnQuc2hpZnRLZXkpIHtcblx0XHRcdGNvbnN0IHN0YXJ0U2VsZWN0aW9uID0gdGhpcy5zZWxlY3RIYW5kbGVyLmdldFNlbGVjdGlvblN0YXJ0KCk7XG5cdFx0XHRpZiAoc3RhcnRTZWxlY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHR0aGlzLnNlbGVjdEhhbmRsZXIuc2V0Rm9jdXNlZChvZmZzZXQpO1xuXHRcdFx0XHRsZXQgc2VsZWN0aW9uQW5jaG9yID0gdGhpcy5zZWxlY3RIYW5kbGVyLmdldEFuY2hvcigpO1xuXHRcdFx0XHRpZiAoc2VsZWN0aW9uQW5jaG9yID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRzZWxlY3Rpb25BbmNob3IgPSBvZmZzZXQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgbWluID0gTWF0aC5taW4oc2VsZWN0aW9uQW5jaG9yLCBvZmZzZXQpO1xuXHRcdFx0XHRjb25zdCBtYXggPSBNYXRoLm1heChvZmZzZXQsIHNlbGVjdGlvbkFuY2hvcik7XG5cdFx0XHRcdHRoaXMuc2VsZWN0SGFuZGxlci5zZXRTZWxlY3RlZChjcmVhdGVPZmZzZXRSYW5nZShtaW4sIG1heCkpO1xuXHRcdFx0XHR0YXJnZXQuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnNlbGVjdEhhbmRsZXIuc2V0QW5jaG9yKG9mZnNldCk7XG5cdFx0XHR0aGlzLnNlbGVjdEhhbmRsZXIuc2V0Rm9jdXNlZChvZmZzZXQpO1xuXHRcdFx0aWYgKGV2ZW50LmN0cmxLZXkpIHtcblx0XHRcdFx0Y29uc3Qgc2VsZWN0aW9uID0gdGhpcy5zZWxlY3RIYW5kbGVyLmdldFNlbGVjdGVkKCk7XG5cdFx0XHRcdGNvbnN0IG5ld1NlbGVjdGlvbiA9IHNlbGVjdGlvbi5maWx0ZXIoaSA9PiBpICE9PSBvZmZzZXQpO1xuXHRcdFx0XHRpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gbmV3U2VsZWN0aW9uLmxlbmd0aCkge1xuXHRcdFx0XHRcdHRoaXMuc2VsZWN0SGFuZGxlci5zZXRTZWxlY3RlZChbLi4ubmV3U2VsZWN0aW9uLCBvZmZzZXRdKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnNlbGVjdEhhbmRsZXIuc2V0U2VsZWN0ZWQobmV3U2VsZWN0aW9uKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zZWxlY3RIYW5kbGVyLnNldFNlbGVjdGVkKFtvZmZzZXRdKTtcblx0XHRcdH1cblx0XHRcdHRoaXMudXBkYXRlSW5zcGVjdG9yKCk7XG5cdFx0XHR0YXJnZXQuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB0aGUgbW91c2Vkb3duIGV2ZW50cyB3aXRoaW4gdGhlIGVkaXRvclxuXHQgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFRoZSBNb3VzZUV2ZW50IHBhc3NlZCB0byB0aGUgZXZlbnQgaGFuZGxlci5cblx0ICovXG5cdHByaXZhdGUgbW91c2VEb3duSGFuZGxlcihldmVudDogTW91c2VFdmVudCk6IHZvaWQge1xuXHRcdGlmIChldmVudC5idXR0b25zICE9PSAxKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuXHRcdGlmICghdGFyZ2V0IHx8IGlzTmFOKGdldEVsZW1lbnRzT2Zmc2V0KHRhcmdldCkpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLmVkaXRIYW5kbGVyLmNvbXBsZXRlUGVuZGluZ0VkaXRzKCk7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gZ2V0RWxlbWVudHNPZmZzZXQodGFyZ2V0KTtcblx0XHRjb25zdCBzdGFydE1vdXNlTW92ZU9mZnNldCA9IG9mZnNldDtcblx0XHRjb25zdCBzdGFydFNlbGVjdGlvbiA9IGV2ZW50LnNoaWZ0S2V5ID8gdGhpcy5zZWxlY3RIYW5kbGVyLmdldFNlbGVjdGlvblN0YXJ0KCkgOiBvZmZzZXQ7XG5cblx0XHRjb25zdCBvbk1vdXNlTW92ZSA9IChldmVudDogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xuXHRcdFx0aWYgKGV2ZW50LmJ1dHRvbnMgIT09IDEpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG5cdFx0XHRpZiAoIXRhcmdldCB8fCBpc05hTihnZXRFbGVtZW50c09mZnNldCh0YXJnZXQpKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IG9mZnNldCA9IGdldEVsZW1lbnRzT2Zmc2V0KHRhcmdldCk7XG5cdFx0XHRpZiAoc3RhcnRTZWxlY3Rpb24gIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IHN0YXJ0TW91c2VNb3ZlT2Zmc2V0KSB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0SGFuZGxlci5zZXRGb2N1c2VkKG9mZnNldCk7XG5cdFx0XHRcdGNvbnN0IG1pbiA9IE1hdGgubWluKHN0YXJ0U2VsZWN0aW9uLCBvZmZzZXQpO1xuXHRcdFx0XHRjb25zdCBtYXggPSBNYXRoLm1heChzdGFydFNlbGVjdGlvbiwgb2Zmc2V0KTtcblx0XHRcdFx0dGhpcy5zZWxlY3RIYW5kbGVyLnNldFNlbGVjdGVkKGNyZWF0ZU9mZnNldFJhbmdlKG1pbiwgbWF4KSk7XG5cdFx0XHRcdHRhcmdldC5mb2N1cyh7IHByZXZlbnRTY3JvbGw6IHRydWUgfSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IG9uTW91c2VVcCA9ICgpOiB2b2lkID0+IHtcblx0XHRcdHRoaXMuZWRpdG9yQ29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuXHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uTW91c2VVcCk7XG5cdFx0XHR0aGlzLnVwZGF0ZUluc3BlY3RvcigpO1xuXHRcdH07XG5cblx0XHR0aGlzLmVkaXRvckNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBhbGwga2V5Ym9hcmQgaW50ZXJhY3Rpb24gd2l0aCB0aGUgbWFpbiBlZGl0b3Igd2luZG93XG5cdCAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgVGhlIEtleWJvYXJkRXZlbnQgcGFzc2VkIHRvIHRoZSBldmVudCBoYW5kbGVyLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBlZGl0b3JLZXlCb2FyZEhhbmRsZXIoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoIWV2ZW50IHx8ICFldmVudC50YXJnZXQpIHJldHVybjtcblx0XHRjb25zdCB0YXJnZXRFbGVtZW50ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuXHRcdGNvbnN0IG1vZGlmaWVyS2V5UHJlc3NlZCA9IGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuYWx0S2V5IHx8IGV2ZW50LmN0cmxLZXk7XG5cdFx0aWYgKGV2ZW50LmtleSA9PT0gXCJUYWJcIikge1xuXHRcdFx0Y29uc3QgY3VycmVudE9mZnNldCA9IGdldEVsZW1lbnRzT2Zmc2V0KHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0Y29uc3QgY29sdW1uVG9Gb2N1cyA9IGdldEVsZW1lbnRzQ29sdW1uKHRhcmdldEVsZW1lbnQpID09PSBcImhleFwiID8gXCJhc2NpaVwiIDogXCJoZXhcIjtcblx0XHRcdHRoaXMuZm9jdXNFbGVtZW50V2l0aEdpdmVuT2Zmc2V0KGN1cnJlbnRPZmZzZXQsIGNvbHVtblRvRm9jdXMpO1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9IGVsc2UgaWYgKG5ldyBSZWdFeHAoL0Fycm93TGVmdHxBcnJvd1JpZ2h0fEFycm93VXB8QXJyb3dEb3duL2dtKS50ZXN0KGV2ZW50LmtleSlcblx0XHRcdHx8ICgoZXZlbnQua2V5ID09PSBcIkVuZFwiIHx8IGV2ZW50LmtleSA9PT0gXCJIb21lXCIpICYmICFldmVudC5jdHJsS2V5KSkge1xuXHRcdFx0dGhpcy5uYXZpZ2F0ZUJ5S2V5KGV2ZW50LmtleSwgdGFyZ2V0RWxlbWVudCwgZXZlbnQuc2hpZnRLZXksIGV2ZW50Lm1ldGFLZXkpO1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9IGVsc2UgaWYgKCFtb2RpZmllcktleVByZXNzZWQgJiYgdGFyZ2V0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJoZXhcIikpIHtcblx0XHRcdGF3YWl0IHRoaXMuZWRpdEhhbmRsZXIuZWRpdEhleCh0YXJnZXRFbGVtZW50LCBldmVudC5rZXkpO1xuXHRcdFx0Ly8gSWYgdGhpcyBjZWxsIGhhcyBiZWVuIGVkaXRlZFxuXHRcdFx0aWYgKHRhcmdldEVsZW1lbnQuaW5uZXJUZXh0LnRyaW1SaWdodCgpLmxlbmd0aCA9PSAyICYmIHRhcmdldEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiZWRpdGluZ1wiKSkge1xuXHRcdFx0XHR0YXJnZXRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJlZGl0aW5nXCIpO1xuXHRcdFx0XHR0aGlzLm5hdmlnYXRlQnlLZXkoXCJBcnJvd1JpZ2h0XCIsIHRhcmdldEVsZW1lbnQsIGZhbHNlLCBmYWxzZSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICghbW9kaWZpZXJLZXlQcmVzc2VkICYmIGV2ZW50LmtleS5sZW5ndGggPT09IDEgJiYgdGFyZ2V0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJhc2NpaVwiKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5lZGl0SGFuZGxlci5lZGl0QXNjaWkodGFyZ2V0RWxlbWVudCwgZXZlbnQua2V5KTtcblx0XHRcdHRhcmdldEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImVkaXRpbmdcIik7XG5cdFx0XHR0aGlzLm5hdmlnYXRlQnlLZXkoXCJBcnJvd1JpZ2h0XCIsIHRhcmdldEVsZW1lbnQsIGZhbHNlLCBmYWxzZSk7XG5cdFx0fVxuXHRcdGF3YWl0IHRoaXMuZWRpdEhhbmRsZXIuY29tcGxldGVQZW5kaW5nRWRpdHMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBrZXlib2FyZCBpdGVyYXRpb24gd2l0aCB0aGUgd2luZG93XG5cdCAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgVGhlIEtleWJvYXJkRXZlbnQgcGFzc2VkIHRvIHRoZSBldmVudCBoYW5kbGVyLlxuXHQgKi9cblx0cHJpdmF0ZSB3aW5kb3dLZXlib2FyZEhhbmRsZXIoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcblx0XHRpZiAoIWV2ZW50IHx8ICFldmVudC50YXJnZXQpIHJldHVybjtcblx0XHRpZiAoKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSkgJiYgZXZlbnQua2V5ID09PSBcImZcIikge1xuXHRcdFx0Ly8gSWYgdGhlIHVzZXIgcHJlc3NlcyBjdHJsIC8gY21kICsgZiB3ZSBmb2N1cyB0aGUgc2VhcmNoIGJveCBhbmQgY2hhbmdlIHRoZSBkcm9wZG93blxuXHRcdFx0dGhpcy5zZWFyY2hIYW5kbGVyLnNlYXJjaEtleWJpbmRpbmdIYW5kbGVyKCk7XG5cdFx0fSBlbHNlIGlmICgoZXZlbnQua2V5ID09IFwiSG9tZVwiIHx8IGV2ZW50LmtleSA9PSBcIkVuZFwiKSAmJiBldmVudC5jdHJsS2V5KSB7XG5cdFx0XHQvLyBJZiB0aGUgdXNlciBwcmVzc2VkIENUUkwgKyBIb21lIG9yIENUUkwgKyBFbmQgd2Ugc2Nyb2xsIHRoZSB3aG9sZSBkb2N1bWVudFxuXHRcdFx0ZXZlbnQua2V5ID09IFwiSG9tZVwiID8gdGhpcy5zY3JvbGxCYXJIYW5kbGVyLnNjcm9sbFRvVG9wKCkgOiB0aGlzLnNjcm9sbEJhckhhbmRsZXIuc2Nyb2xsVG9Cb3R0b20oKTtcblx0XHR9IGVsc2UgaWYgKGV2ZW50LmtleSA9PSBcIlBhZ2VVcFwiKSB7XG5cdFx0XHQvLyBQRyBVcFxuXHRcdFx0dGhpcy5zY3JvbGxCYXJIYW5kbGVyLnBhZ2UodGhpcy52aWV3UG9ydEhlaWdodCwgXCJ1cFwiKTtcblx0XHR9IGVsc2UgaWYgKGV2ZW50LmtleSA9PSBcIlBhZ2VEb3duXCIpIHtcblx0XHRcdC8vIFBHIERvd25cblx0XHRcdHRoaXMuc2Nyb2xsQmFySGFuZGxlci5wYWdlKHRoaXMudmlld1BvcnRIZWlnaHQsIFwiZG93blwiKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgd2hlbiB0aGUgdXNlciB1c2VzIHRoZSBhcnJvdyBrZXlzLCBIb21lIG9yIEVuZCB0byBuYXZpZ2F0ZSB0aGUgZWRpdG9yXG5cdCAqIEBwYXJhbSBrZXlOYW1lIHRoZSBuYW1lIG9mIHRoZSBrZXkgYmVpbmcgcHJlc3NlZCAoY29tZXMgZnJvbSAua2V5KVxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXRFbGVtZW50IFRoZSBlbGVtZW50XG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNSYW5nZVNlbGVjdGlvbiBJZiB3ZSBhcmUgc2VsZWN0aW5nIGEgcmFuZ2UgKHNoaWZ0IGtleSBwcmVzc2VkKVxuXHQgKi9cblx0cHJpdmF0ZSBuYXZpZ2F0ZUJ5S2V5KGtleU5hbWU6IHN0cmluZywgdGFyZ2V0RWxlbWVudDogSFRNTEVsZW1lbnQsIGlzUmFuZ2VTZWxlY3Rpb246IGJvb2xlYW4sIG1ldGFLZXk6IGJvb2xlYW4pOiB2b2lkIHtcblx0XHRsZXQgbmV4dDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG5cdFx0c3dpdGNoIChrZXlOYW1lKSB7XG5cdFx0XHRjYXNlIFwiQXJyb3dMZWZ0XCI6IG5leHQgPSAoKGlzTWFjICYmIG1ldGFLZXkpID8gdGhpcy5fZ2V0U3RhcnRPZkxpbmVDZWxsIDogdGhpcy5fZ2V0UHJldmlvdXNDZWxsKSh0YXJnZXRFbGVtZW50KTsgYnJlYWs7XG5cdFx0XHRjYXNlIFwiQXJyb3dSaWdodFwiOiBuZXh0ID0gKChpc01hYyAmJiBtZXRhS2V5KSA/IHRoaXMuX2dldEVuZE9mTGluZUNlbGwgOiB0aGlzLl9nZXROZXh0Q2VsbCkodGFyZ2V0RWxlbWVudCk7IGJyZWFrIDtcblx0XHRcdGNhc2UgXCJBcnJvd1VwXCI6IG5leHQgPSB0aGlzLl9nZXRDZWxsQWJvdmUodGFyZ2V0RWxlbWVudCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSBcIkFycm93RG93blwiOiBuZXh0ID0gdGhpcy5fZ2V0Q2VsbEJlbG93KHRhcmdldEVsZW1lbnQpOyBicmVhaztcblx0XHRcdGNhc2UgXCJFbmRcIjogbmV4dCA9IHRoaXMuX2dldEVuZE9mTGluZUNlbGwodGFyZ2V0RWxlbWVudCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSBcIkhvbWVcIjogbmV4dCA9IHRoaXMuX2dldFN0YXJ0T2ZMaW5lQ2VsbCh0YXJnZXRFbGVtZW50KTsgYnJlYWs7XG5cdFx0fVxuXHRcdGlmIChuZXh0Py50YWdOYW1lID09PSBcIlNQQU5cIikge1xuXHRcdFx0Y29uc3QgbmV4dFJlY3QgPSBuZXh0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0aWYgKHRoaXMudmlld1BvcnRIZWlnaHQgPD0gbmV4dFJlY3QuYm90dG9tKSB7XG5cdFx0XHRcdHRoaXMuc2Nyb2xsQmFySGFuZGxlci5zY3JvbGxEb2N1bWVudCgxLCBcImRvd25cIik7XG5cdFx0XHR9IGVsc2UgaWYgKG5leHRSZWN0LnRvcCA8PSAwKSB7XG5cdFx0XHRcdHRoaXMuc2Nyb2xsQmFySGFuZGxlci5zY3JvbGxEb2N1bWVudCgxLCBcInVwXCIpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBvZmZzZXQgPSBnZXRFbGVtZW50c09mZnNldChuZXh0KTtcblx0XHRcdHRoaXMuc2VsZWN0SGFuZGxlci5zZXRGb2N1c2VkKG9mZnNldCk7XG5cdFx0XHRjb25zdCBzdGFydFNlbGVjdGlvbiA9IHRoaXMuc2VsZWN0SGFuZGxlci5nZXRTZWxlY3Rpb25TdGFydCgpO1xuXHRcdFx0Y29uc3QgY3VycmVudFNlbGVjdGlvbiA9IHRoaXMuc2VsZWN0SGFuZGxlci5nZXRTZWxlY3RlZCgpO1xuXHRcdFx0aWYgKGlzUmFuZ2VTZWxlY3Rpb24gJiYgc3RhcnRTZWxlY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRjb25zdCBtaW4gPSBNYXRoLm1pbihzdGFydFNlbGVjdGlvbiwgb2Zmc2V0KTtcblx0XHRcdFx0Y29uc3QgbWF4ID0gTWF0aC5tYXgob2Zmc2V0LCBjdXJyZW50U2VsZWN0aW9uW2N1cnJlbnRTZWxlY3Rpb24ubGVuZ3RoIC0gMV0pO1xuXHRcdFx0XHR0aGlzLnNlbGVjdEhhbmRsZXIuc2V0U2VsZWN0ZWQoY3JlYXRlT2Zmc2V0UmFuZ2UobWluLCBtYXgpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0SGFuZGxlci5zZXRTZWxlY3RlZChbb2Zmc2V0XSk7XG5cdFx0XHRcdHRoaXMudXBkYXRlSW5zcGVjdG9yKCk7XG5cdFx0XHR9XG5cdFx0XHRuZXh0LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIF9nZXRQcmV2aW91c0NlbGwoY3VycmVudENlbGw6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuXHRcdHJldHVybiAoY3VycmVudENlbGwucHJldmlvdXNFbGVtZW50U2libGluZyB8fCBjdXJyZW50Q2VsbC5wYXJlbnRFbGVtZW50Py5wcmV2aW91c0VsZW1lbnRTaWJsaW5nPy5jaGlsZHJlblsxNV0pIGFzIEhUTUxFbGVtZW50O1xuXHR9XG5cblx0cHJpdmF0ZSBfZ2V0TmV4dENlbGwoY3VycmVudENlbGw6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuXHRcdHJldHVybiAoY3VycmVudENlbGwubmV4dEVsZW1lbnRTaWJsaW5nIHx8IGN1cnJlbnRDZWxsLnBhcmVudEVsZW1lbnQ/Lm5leHRFbGVtZW50U2libGluZz8uY2hpbGRyZW5bMF0pIGFzIEhUTUxFbGVtZW50O1xuXHR9XG5cblx0cHJpdmF0ZSBfZ2V0U3RhcnRPZkxpbmVDZWxsKGN1cnJlbnRDZWxsOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcblx0XHRyZXR1cm4gY3VycmVudENlbGwucGFyZW50RWxlbWVudCEuY2hpbGRyZW5bMF0gYXMgSFRNTEVsZW1lbnQ7XG5cdH1cblxuXHRwcml2YXRlIF9nZXRFbmRPZkxpbmVDZWxsKGN1cnJlbnRDZWxsOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcblx0XHRjb25zdCBwYXJlbnRDaGlsZHJlbiA9IGN1cnJlbnRDZWxsLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuO1xuXHRcdHJldHVybiBwYXJlbnRDaGlsZHJlbltwYXJlbnRDaGlsZHJlbi5sZW5ndGggLSAxXSBhcyBIVE1MRWxlbWVudDtcblx0fVxuXG5cdHByaXZhdGUgX2dldENlbGxBYm92ZShjdXJyZW50Q2VsbDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB7XG5cdFx0Y29uc3QgZWxlbWVudHNfYWJvdmUgPSBnZXRFbGVtZW50c1dpdGhHaXZlbk9mZnNldChnZXRFbGVtZW50c09mZnNldChjdXJyZW50Q2VsbCkgLSAxNik7XG5cdFx0aWYgKGVsZW1lbnRzX2Fib3ZlLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmV0dXJuIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImhleFwiKSA/IGVsZW1lbnRzX2Fib3ZlWzBdIDogZWxlbWVudHNfYWJvdmVbMV07XG5cdH1cblxuXHRwcml2YXRlIF9nZXRDZWxsQmVsb3coY3VycmVudENlbGw6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuXHRcdGNvbnN0IGVsZW1lbnRzX2JlbG93ID0gZ2V0RWxlbWVudHNXaXRoR2l2ZW5PZmZzZXQoTWF0aC5taW4oZ2V0RWxlbWVudHNPZmZzZXQoY3VycmVudENlbGwpICsgMTYsIHRoaXMuZmlsZVNpemUgLSAxKSk7XG5cdFx0aWYgKGVsZW1lbnRzX2JlbG93Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmV0dXJuIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImhleFwiKSA/IGVsZW1lbnRzX2JlbG93WzBdIDogZWxlbWVudHNfYmVsb3dbMV07XG5cdH1cblxuXHQvKioqXG5cdCAqIEBkZXNjcmlwdGlvbiBQb3B1bGF0ZXMgdGhlIGluc3BlY3RvciBkYXRhIHdpdGggdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBlbGVtZW50LlxuXHQgKi9cblx0cHJpdmF0ZSB1cGRhdGVJbnNwZWN0b3IoKTogdm9pZCB7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gdGhpcy5zZWxlY3RIYW5kbGVyLmdldFNlbGVjdGlvblN0YXJ0KCk7XG5cdFx0aWYgKG9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zdCBlbGVtZW50cyA9IGdldEVsZW1lbnRzV2l0aEdpdmVuT2Zmc2V0KG9mZnNldCk7XG5cdFx0XHRjb25zdCBieXRlX29iaiA9IHJldHJpZXZlU2VsZWN0ZWRCeXRlT2JqZWN0KGVsZW1lbnRzKSE7XG5cdFx0XHREYXRhSW5zcGVjdG9ySGFuZGxlci51cGRhdGVJbnNwZWN0b3IoYnl0ZV9vYmopO1xuXHRcdH1cblx0fVxuXG5cdC8qKipcblx0ICogQGRlc2NyaXB0aW9uIEdpdmVuIGFuIGFycmF5IG9mIG9mZnNldHMsIHNlbGVjdHMgdGhlIGNvcnJlc3BvbmRpbmcgZWxlbWVudHMuXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IG9mZnNldHMgVGhlIG9mZnNldHMgb2YgdGhlIGVsZW1lbnRzIHlvdSB3YW50IHRvIHNlbGVjdFxuXHQgKi9cblx0cHVibGljIHNldFNlbGVjdGlvbihvZmZzZXRzOiBudW1iZXJbXSk6IHZvaWQge1xuXHRcdHRoaXMuc2VsZWN0SGFuZGxlci5zZXRTZWxlY3RlZChvZmZzZXRzKTtcblx0fVxuXG5cdC8qKipcblx0ICogQGRlc2NyaXB0aW9uIEdpdmVuIGFuIG9mZnNldCwgc2VsZWN0cyB0aGUgZWxlbWVudHMgYW5kIGZvY3VzZXMgdGhlIGVsZW1lbnQgaW4gdGhlIHNhbWUgY29sdW1uIGFzIHByZXZpb3VzIGZvY3VzLiBEZWZhdWx0cyB0byBoZXguXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgVGhlIG9mZnNldCBvZiB0aGUgZWxlbWVudHMgeW91IHdhbnQgdG8gc2VsZWN0IGFuZCBmb2N1c1xuXHQgKiBAcGFyYW0gY29sdW1uIE9wdGlvbmFsIGNvbHVtbiBjYW4gYmUgcHJvdmlkZWQgdG8gZm9yY2UgZm9jdXMgdG8gdGhhdCBjb2x1bW5cblx0ICovXG5cdHB1YmxpYyBmb2N1c0VsZW1lbnRXaXRoR2l2ZW5PZmZzZXQob2Zmc2V0OiBudW1iZXIsIGNvbHVtbj86IFwiaGV4XCIgfCBcImFzY2lpXCIpOiB2b2lkIHtcblx0XHRjb25zdCBlbGVtZW50cyA9IGdldEVsZW1lbnRzV2l0aEdpdmVuT2Zmc2V0KG9mZnNldCk7XG5cdFx0aWYgKGVsZW1lbnRzLmxlbmd0aCAhPSAyKSByZXR1cm47XG5cdFx0dGhpcy5zZWxlY3RIYW5kbGVyLnNldFNlbGVjdGVkKFtvZmZzZXRdKTtcblx0XHR0aGlzLnVwZGF0ZUluc3BlY3RvcigpO1xuXHRcdC8vIElmIGFuIGFzY2lpIGVsZW1lbnQgaXMgY3VycmVudGx5IGZvY3VzZWQgdGhlbiB3ZSBmb2N1cyB0aGF0LCBlbHNlIHdlIGZvY3VzIGhleFxuXHRcdGlmICgoIWNvbHVtbiAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGdldEVsZW1lbnRzQ29sdW1uKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpID09PSBcImFzY2lpXCIpIHx8IGNvbHVtbiA9PT0gXCJhc2NpaVwiKSB7XG5cdFx0XHRlbGVtZW50c1sxXS5mb2N1cygpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRlbGVtZW50c1swXS5mb2N1cygpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gVW5kb2VzIHRoZSBnaXZlbiBlZGl0cyBmcm9tIHRoZSBkb2N1bWVudFxuXHQgKiBAcGFyYW0ge0VkaXRNZXNzYWdlW119IGVkaXRzIFRoZSBlZGl0cyB0aGF0IHdpbGwgYmUgdW5kb25lXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBmaWxlU2l6ZSBUaGUgc2l6ZSBvZiB0aGUgZmlsZSwgdGhlIGV4dCBob3N0IHRyYWNrcyB0aGlzIGFuZCBwYXNzZXMgaXQgYmFja1xuXHQgKi9cblx0cHVibGljIHVuZG8oZWRpdHM6IEVkaXRNZXNzYWdlW10sIGZpbGVTaXplOiBudW1iZXIpOiB2b2lkIHtcblx0XHR0aGlzLmZpbGVTaXplID0gZmlsZVNpemU7XG5cdFx0dGhpcy5lZGl0SGFuZGxlci51bmRvKGVkaXRzKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gUmVkb2VzIHRoZSBnaXZlbiBlZGl0cyBmcm9tIHRoZSBkb2N1bWVudFxuXHQgKiBAcGFyYW0ge0VkaXRNZXNzYWdlW119IGVkaXRzIFRoZSBlZGl0cyB0aGF0IHdpbGwgYmUgcmVkb25lXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBmaWxlU2l6ZSBUaGUgc2l6ZSBvZiB0aGUgZmlsZSwgdGhlIGV4dCBob3N0IHRyYWNrcyB0aGlzIGFuZCBwYXNzZXMgaXQgYmFja2Vkb25lXG5cdCAqL1xuXHRwdWJsaWMgcmVkbyhlZGl0czogRWRpdE1lc3NhZ2VbXSwgZmlsZVNpemU6IG51bWJlcik6IHZvaWQge1xuXHRcdHRoaXMuZWRpdEhhbmRsZXIucmVkbyhlZGl0cyk7XG5cdFx0dGhpcy5maWxlU2l6ZSA9IGZpbGVTaXplO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBDYWxsZWQgd2hlbiB0aGUgdXNlciBleGVjdXRlcyByZXZlcnRcblx0ICovXG5cdHB1YmxpYyByZXZlcnQoZmlsZVNpemU6IG51bWJlcik6IHZvaWQge1xuXHRcdHRoaXMuZmlsZVNpemUgPSBmaWxlU2l6ZTtcblx0XHR0aGlzLmVkaXRIYW5kbGVyLnJldmVydCgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGFuIGFkZCBjZWxsICh0aGUgbGl0dGxlIHBsdXMgcGxhY2Vob2xkZXIpIGFuZCBwbGFjZXMgaXQgYXQgdGhlIGVuZCBvZiB0aGUgZG9jdW1lbnRcblx0ICovXG5cdHB1YmxpYyBjcmVhdGVBZGRDZWxsKCk6IHZvaWQge1xuXHRcdC8vIERvbid0IG1ha2UgbW9yZSBtb3JlIGFkZCBjZWxscyB1bnRpbCB0aGVyZSBhcmUgbm9uZSBsZWZ0IG9uIHRoZSBET01cblx0XHRpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImFkZC1jZWxsXCIpLmxlbmd0aCAhPT0gMCkgcmV0dXJuO1xuXHRcdC8vIFRoaXMgd2lsbCBzdGFydCBhIG5ldyByb3dcblx0XHRjb25zdCBwYWNrZXQ6IFZpcnR1YWxpemVkUGFja2V0ID0ge1xuXHRcdFx0b2Zmc2V0OiB0aGlzLmZpbGVTaXplLFxuXHRcdFx0ZGF0YTogbmV3IEJ5dGVEYXRhKDApXG5cdFx0fTtcblx0XHRpZiAodGhpcy5maWxlU2l6ZSAlIDE2ID09PSAwKSB7XG5cdFx0XHR0aGlzLnJlbmRlcihbcGFja2V0XSk7XG5cdFx0XHQvLyBJZiBpdCdzIGEgbmV3IGNodW5rIHdlIHdhbnQgdGhlIGNodW5raGFuZGxlciB0byB0cmFjayBpdFxuXHRcdFx0aWYgKHRoaXMuZmlsZVNpemUgJSBjaHVua0hhbmRsZXIuY2h1bmtTaXplID09PSAwKSB7XG5cdFx0XHRcdGNodW5rSGFuZGxlci5hZGRDaHVuayh0aGlzLmZpbGVTaXplKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuc2Nyb2xsQmFySGFuZGxlci51cGRhdGVTY3JvbGxCYXIodGhpcy5maWxlU2l6ZSAvIDE2KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgaGV4X2VsZW1lbnQgPSB0aGlzLmNyZWF0ZUhleEVsZW1lbnQocGFja2V0KTtcblx0XHRcdGNvbnN0IGFzY2lpX2VsZW1lbnQgPSB0aGlzLmNyZWF0ZUFzY2lpRWxlbWVudChwYWNrZXQpO1xuXHRcdFx0Y29uc3QgZWxlbWVudHMgPSBnZXRFbGVtZW50c1dpdGhHaXZlbk9mZnNldCh0aGlzLmZpbGVTaXplIC0gMSk7XG5cdFx0XHRlbGVtZW50c1swXS5wYXJlbnRFbGVtZW50Py5hcHBlbmRDaGlsZChoZXhfZWxlbWVudCk7XG5cdFx0XHRlbGVtZW50c1sxXS5wYXJlbnRFbGVtZW50Py5hcHBlbmRDaGlsZChhc2NpaV9lbGVtZW50KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJlbW92ZXMgdGhlIGxhc3QgY2VsbCBmcm9tIHRoZSB2aXJ0dWFsIGRvY3VtZW50XG5cdCAqL1xuXHRwdWJsaWMgcmVtb3ZlTGFzdENlbGwoKTogdm9pZCB7XG5cdFx0Ly8gV2UgY2FuIHVzZSB0aGUgYWRkIGNlbGwgYXMgdGhlIGxhc3QgY2VsbCBvZmZzZXQgc2luY2UgYSBwbHVzIGNlbGwgc2hvdWxkIGFsd2F5cyBiZSB0aGUgbGFzdCBjZWxsXG5cdFx0Y29uc3QgcGx1c0NlbGxPZmZzZXQgPSBnZXRFbGVtZW50c09mZnNldChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiYWRkLWNlbGxcIilbMF0pO1xuXHRcdGlmIChpc05hTihwbHVzQ2VsbE9mZnNldCkpIHJldHVybjtcblx0XHRjb25zdCBsYXN0Q2VsbHMgPSBnZXRFbGVtZW50c1dpdGhHaXZlbk9mZnNldChwbHVzQ2VsbE9mZnNldCk7XG5cdFx0Y29uc3Qgc2Vjb25kVG9MYXN0Q2VsbHMgPSBnZXRFbGVtZW50c1dpdGhHaXZlbk9mZnNldChwbHVzQ2VsbE9mZnNldCAtIDEpO1xuXHRcdC8vIElmIHRoZSBsYXN0IGNlbGwgd2FzIG9uIGl0cyBvd24gcm93IHdlIHJlbW92ZSB0aGUgbmV3IHJvd1xuXHRcdGlmIChwbHVzQ2VsbE9mZnNldCAlIDE2ID09PSAwKSB7XG5cdFx0XHR0aGlzLnJvd3NbMF0uZ2V0KHBsdXNDZWxsT2Zmc2V0LnRvU3RyaW5nKCkpPy5yZW1vdmUoKTtcblx0XHRcdHRoaXMucm93c1swXS5kZWxldGUocGx1c0NlbGxPZmZzZXQudG9TdHJpbmcoKSk7XG5cdFx0XHR0aGlzLnJvd3NbMV0uZ2V0KHBsdXNDZWxsT2Zmc2V0LnRvU3RyaW5nKCkpPy5yZW1vdmUoKTtcblx0XHRcdHRoaXMucm93c1sxXS5kZWxldGUocGx1c0NlbGxPZmZzZXQudG9TdHJpbmcoKSk7XG5cdFx0XHR0aGlzLnJvd3NbMl0uZ2V0KHBsdXNDZWxsT2Zmc2V0LnRvU3RyaW5nKCkpPy5yZW1vdmUoKTtcblx0XHRcdHRoaXMucm93c1syXS5kZWxldGUocGx1c0NlbGxPZmZzZXQudG9TdHJpbmcoKSk7XG5cdFx0XHR0aGlzLnNjcm9sbEJhckhhbmRsZXIudXBkYXRlU2Nyb2xsQmFyKChwbHVzQ2VsbE9mZnNldCAtIDEpIC8gMTYpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXZWlyZGx5IGVub3VnaCBhZnRlciB0aGUgZmlyc3QgaXMgcmVtb3ZlZCB0aGUgbmV4dCBvbmUgc2xpZGVzIG92ZXIgc28gd2UganVzdFxuXHRcdFx0Ly8gY2FsbCByZW1vdmUgb24gdGhlIGZpcnN0IGVsZW1lbnQgdHdpY2UgdG8gcmVtb3ZlIGJvdGggcGx1c2VzXG5cdFx0XHRsYXN0Q2VsbHNbMF0ucmVtb3ZlKCk7XG5cdFx0XHRsYXN0Q2VsbHNbMF0ucmVtb3ZlKCk7XG5cdFx0fVxuXHRcdHNlY29uZFRvTGFzdENlbGxzWzBdLmlubmVyVGV4dCA9IFwiK1wiO1xuXHRcdHNlY29uZFRvTGFzdENlbGxzWzBdLmNsYXNzTGlzdC5hZGQoXCJhZGQtY2VsbFwiKTtcblx0XHRzZWNvbmRUb0xhc3RDZWxsc1swXS5jbGFzc0xpc3QucmVtb3ZlKFwibm9uZ3JhcGhpY1wiKTtcblx0XHRzZWNvbmRUb0xhc3RDZWxsc1swXS5jbGFzc0xpc3QucmVtb3ZlKFwiZWRpdGVkXCIpO1xuXHRcdHNlY29uZFRvTGFzdENlbGxzWzFdLmlubmVyVGV4dCA9IFwiK1wiO1xuXHRcdHNlY29uZFRvTGFzdENlbGxzWzFdLmNsYXNzTGlzdC5yZW1vdmUoXCJub25ncmFwaGljXCIpO1xuXHRcdHNlY29uZFRvTGFzdENlbGxzWzFdLmNsYXNzTGlzdC5hZGQoXCJhZGQtY2VsbFwiKTtcblx0XHRzZWNvbmRUb0xhc3RDZWxsc1sxXS5jbGFzc0xpc3QucmVtb3ZlKFwiZWRpdGVkXCIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBTaW1wbGUgZ2V0dGVyIGZvciB0aGUgZmlsZVNpemVcblx0ICogQHJldHVybnMge251bWJlcn0gVGhlIGZpbGVTaXplXG5cdCAqL1xuXHRwdWJsaWMgZ2V0IGRvY3VtZW50U2l6ZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5maWxlU2l6ZTsgfVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gVXBkYXRlcyB0aGUgZmlsZSBzaXplIHNvIGl0cyBpbiBzeW5jIHdpdGggZXh0IGhvc3Rcblx0ICogQHBhcmFtIHtudW1iZXJ9IG5ld1NpemUgVGhlIG5ldyBmaWxlc2l6ZVxuXHQgKi9cblx0cHVibGljIHVwZGF0ZURvY3VtZW50U2l6ZShuZXdTaXplOiBudW1iZXIpOiB2b2lkIHtcblx0XHR0aGlzLmZpbGVTaXplID0gbmV3U2l6ZTtcblx0fVxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJlLXJlcXVlc3RzIGFsbCB0aGUgY2h1bmtzIG9uIHRoZSBET00gZm9yIHJlbmRlcmluZy4gVGhpcyBpcyBuZWVkZWQgZm9yIHJldmVydFxuXHQgKi9cblx0cHVibGljIGFzeW5jIHJlUmVxdWVzdENodW5rcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBJZiB3ZSBkb24ndCBkbyBBcnJheS5mcm9tIGl0IHdpbGwgc3RpbGwgcmVmZXJlbmNlIHRoZSBvcmlnaW5hbCBzZXQgY2F1c2luZyBpdCB0byBpbmZpbml0ZWx5IHJlcXVlc3QgYW5kIGRlbGV0ZSB0aGUgY2h1bmtzXG5cdFx0Y29uc3QgYWxsQ2h1bmtzID0gQXJyYXkuZnJvbShjaHVua0hhbmRsZXIuYWxsQ2h1bmtzKTtcblx0XHRmb3IgKGNvbnN0IGNodW5rIG9mIGFsbENodW5rcykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCB0aGUgY2h1bmtzIGZyb20gdGhlIERPTVxuXHRcdFx0Zm9yIChsZXQgaSA9IGNodW5rOyBpIDwgY2h1bmsgKyBjaHVua0hhbmRsZXIuY2h1bmtTaXplOyBpICs9IDE2KSB7XG5cdFx0XHRcdHRoaXMucm93c1swXS5nZXQoaS50b1N0cmluZygpKT8ucmVtb3ZlKCk7XG5cdFx0XHRcdHRoaXMucm93c1swXS5kZWxldGUoaS50b1N0cmluZygpKTtcblx0XHRcdFx0dGhpcy5yb3dzWzFdLmdldChpLnRvU3RyaW5nKCkpPy5yZW1vdmUoKTtcblx0XHRcdFx0dGhpcy5yb3dzWzFdLmRlbGV0ZShpLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHR0aGlzLnJvd3NbMl0uZ2V0KGkudG9TdHJpbmcoKSk/LnJlbW92ZSgpO1xuXHRcdFx0XHR0aGlzLnJvd3NbMl0uZGVsZXRlKGkudG9TdHJpbmcoKSk7XG5cdFx0XHR9XG5cdFx0XHRjaHVua0hhbmRsZXIucmVtb3ZlQ2h1bmsoY2h1bmspO1xuXHRcdFx0YXdhaXQgY2h1bmtIYW5kbGVyLnJlcXVlc3RNb3JlQ2h1bmtzKGNodW5rKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFNjcm9sbHMgdG8gdGhlIGdpdmVuIG9mZnNldCBpZiBpdCdzIG91dHNpZGUgdGhlIHZpZXdwb3J0XG5cdCAqIEBwYXJhbSBvZmZzZXQgVGhlIG9mZnNldCB0byBzY3JvbGwgdG9cblx0ICogQHBhcmFtIGZvcmNlIFdoZXRoZXIgb3Igbm90IHlvdSBzaG91bGQgc2Nyb2xsIGV2ZW4gaWYgaXQncyBpbiB0aGUgdmlld3BvcnRcblx0ICovXG5cdHB1YmxpYyBhc3luYyBzY3JvbGxEb2N1bWVudFRvT2Zmc2V0KG9mZnNldDogbnVtYmVyLCBmb3JjZT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWRbXT4ge1xuXHRcdHJldHVybiB0aGlzLnNjcm9sbEJhckhhbmRsZXIuc2Nyb2xsVG9PZmZzZXQob2Zmc2V0LCBmb3JjZSk7XG5cdH1cbn1cbiIsICIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgdmlydHVhbEhleERvY3VtZW50LCBtZXNzYWdlSGFuZGxlciB9IGZyb20gXCIuL2hleEVkaXRcIjtcbmltcG9ydCB7IFZpcnR1YWxpemVkUGFja2V0IH0gZnJvbSBcIi4vdmlydHVhbERvY3VtZW50XCI7XG5pbXBvcnQgeyBCeXRlRGF0YSB9IGZyb20gXCIuL2J5dGVEYXRhXCI7XG5pbXBvcnQgeyBFZGl0TWVzc2FnZSB9IGZyb20gXCIuL2VkaXRIYW5kbGVyXCI7XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIEJ1ZmZlck9wdGlvbnMgdHlwZSB1c2VkIHRvIGRlc2NyaWJlIGhvdyBtYW55IGNodW5rcyBhcmUgd2FudGVkIGFib3ZlIGFuZCBiZWxvdyBhIGdpdmVuIGNodW5rXG4gKi9cbmV4cG9ydCB0eXBlIEJ1ZmZlck9wdGlvbnMgPSB7XG5cdHRvcEJ1ZmZlclNpemU6IG51bWJlcjtcblx0Ym90dG9tQnVmZmVyU2l6ZTogbnVtYmVyO1xufVxuLyoqXG4gKiBAZGVzY3JpcHRpb24gQSBjaHVua2hhbmRsZXIgd2hpY2ggaG9sZHMgdGhlIGNodW5rcyBhbmQgaGFuZGxlcyByZXF1ZXN0aW5nIG5ldyBvbmVzXG4gKi9cbmV4cG9ydCBjbGFzcyBDaHVua0hhbmRsZXIge1xuXHRwcml2YXRlIGNodW5rczogU2V0PG51bWJlcj47XG5cdHByaXZhdGUgX2NodW5rU2l6ZTogbnVtYmVyXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gQ29uc3RydWN0cyBhIGNodW5rIGhhbmRsZXIgd2hpY2ggaGFuZGxlcyBjaHVua3Mgb2Ygc2l6ZSBjaHVua1NpemVcblx0ICogQHBhcmFtIHtudW1iZXJ9IGNodW5rU2l6ZSBUaGUgc2l6ZSBvZiB0aGUgY2h1bmtzIHdoaWNoIHRoZSBjaHVua2hhbmRsZXIgaG9sZHNcblx0ICovXG5cdGNvbnN0cnVjdG9yKGNodW5rU2l6ZTogbnVtYmVyKSB7XG5cdFx0dGhpcy5jaHVua3MgPSBuZXcgU2V0PG51bWJlcj4oKTtcblx0XHR0aGlzLl9jaHVua1NpemUgPSBjaHVua1NpemU7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFJldHVybnMgdGhlIHNpemUgb2YgYSBjaHVuayBpbiB0aGUgY2h1bmsgaGFuZGxlclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgc2l6ZSBvZiBhIGNodW5rXG5cdCAqL1xuXHRwdWJsaWMgZ2V0IGNodW5rU2l6ZSgpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLl9jaHVua1NpemU7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFdoZXRoZXIgb3Igbm90IGEgY2h1bmsgaG9sZGluZyB0aGUgb2Zmc2V0IGlzIGJlaW5nIHRyYWNrZWQgYnkgdGhlIGNodW5raGFuZGxlclxuXHQgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IFRoZSBvZmZzZXQgdG8gY2hlY2sgYWdhaW5zdFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gd2hldGhlciBvciBub3QgYSBjaHVuayBjb250YWluaW5nIHRoYXQgb2Zmc2V0IGlzIGJlaW5nIHRyYWNrZWRcblx0ICovXG5cdHB1YmxpYyBoYXNDaHVuayhvZmZzZXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGNodW5rU3RhcnQgPSB0aGlzLnJldHJpZXZlQ2h1bmtTdGFydChvZmZzZXQpO1xuXHRcdHJldHVybiB0aGlzLmNodW5rcy5oYXMoY2h1bmtTdGFydCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIFNlbmRzIGEgcmVxdWVzdCB0byB0aGUgZXh0ZW5zaW9uIGZvciB0aGUgcGFja2V0cyB3aGljaCB3b3VsZCBtYWtlIHVwIHRoZSByZXF1ZXN0ZWQgY2h1bmtzXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBjaHVua1N0YXJ0IFRoZSBzdGFydCBvZiB0aGUgY2h1bmsgd2hpY2ggeW91J3JlIHJlcXVlc3Rpbmdcblx0ICovXG5cdHB1YmxpYyBhc3luYyByZXF1ZXN0TW9yZUNodW5rcyhjaHVua1N0YXJ0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBJZiB0aGUgY2h1bmsgc3RhcnQgaXMgYWJvdmUgdGhlIGRvY3VtZW50IHNpemUgd2Uga25vdyBpdCB3aWxsIG5vdCBnaXZlIHVzIGFueXRoaW5nIGJhY2sgc28gd2UgZG9uJ3QgZG8gYW55dGhpbmdcblx0XHRpZiAoY2h1bmtTdGFydCA+PSB2aXJ0dWFsSGV4RG9jdW1lbnQuZG9jdW1lbnRTaXplICYmIGNodW5rU3RhcnQgIT09IDApIHJldHVybjtcblx0XHQvLyBSZXF1ZXN0cyB0aGUgY2h1bmtzIGZyb20gdGhlIGV4dGVuc2lvblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZXF1ZXN0ID0gYXdhaXQgbWVzc2FnZUhhbmRsZXIucG9zdE1lc3NhZ2VXaXRoUmVzcG9uc2UoXCJwYWNrZXRcIiwge1xuXHRcdFx0XHRpbml0aWFsT2Zmc2V0OiBjaHVua1N0YXJ0LFxuXHRcdFx0XHRudW1FbGVtZW50czogdGhpcy5jaHVua1NpemVcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5wcm9jZXNzQ2h1bmtzKHJlcXVlc3Qub2Zmc2V0LCByZXF1ZXN0LmRhdGEsIHJlcXVlc3QuZWRpdHMsIHJlcXVlc3QuZmlsZVNpemUpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gR2l2ZW4gYW4gb2Zmc2V0IHRlbGxzIHlvdSB3aGljaCBvZmZzZXQgYmVnaW5zIGl0IGNodW5rc1xuXHQgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IFRoZSBvZmZzZXQgd2hpY2ggeW91IHdhbnQgdG8ga25vdyB0aGUgY2h1bmsgc3RhcnQgb2Zcblx0ICogQHJldHVybnMge251bWJlcn0gVGhlIGNodW5rIHN0YXJ0IG9mIHRoZSBwcm92aWRlZCBvZmZzZXRcblx0ICovXG5cdHB1YmxpYyByZXRyaWV2ZUNodW5rU3RhcnQob2Zmc2V0OiBudW1iZXIpOiBudW1iZXIge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKG9mZnNldCAvIHRoaXMuY2h1bmtTaXplKSAqIHRoaXMuY2h1bmtTaXplO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBDYWxsZWQgYnkgdGhlIHZpcnR1YWxEb2N1bWVudCB0byBlbnN1cmUgdGhlcmUgaXMgYnVmZmVyU2l6ZSBjaHVua3MgYWJvdmUgYW5kIGJlbG93IHRoZSBvZmZzZXQgcHJvdmlkZWRcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBUaGUgb2Zmc2V0IGdpdmVuIHRvIGNoZWNrIHRoZSBidWZmZXIgYXJvdW5kXG5cdCAqIEBwYXJhbSB7QnVmZmVyT3B0aW9uc30gYnVmZmVyT3B0cyBUaGUgb3B0aW9ucyBkZXNjcmliaW5nIGhvdyBtYW55IGNodW5rcyBhYm92ZSBhbmQgYmVsb3cgdGhlIGdpdmVuIG9mZnNldCB5b3Ugd2FudFxuXHQgKiBAcmV0dXJucyB7UHJvbWlzZTx7cmVtb3ZlZDogbnVtYmVyW107IHJlcXVlc3RlZDogUHJvbWlzZTx2b2lkW10+fT59IEEgcHJvbWlzZSB3aXRoIGFuIGFycmF5IG9mIHJlbW92ZWQgY2h1bmsgc3RhcnRzIGFuZCBhIHByb21pc2Ugd2hpY2ggaXMgYXdhaXRpbmcgdGhlIHJlcXVlc3RlZCBjaHVua3Ncblx0ICovXG5cdHB1YmxpYyBhc3luYyBlbnN1cmVCdWZmZXIob2Zmc2V0OiBudW1iZXIsIGJ1ZmZlck9wdHM6IEJ1ZmZlck9wdGlvbnMpOiBQcm9taXNlPHsgcmVtb3ZlZDogbnVtYmVyW107IHJlcXVlc3RlZDogUHJvbWlzZTx2b2lkW10+IH0+IHtcblx0XHRjb25zdCBjaHVua3NUb1JlcXVlc3Q6IFNldDxudW1iZXI+ID0gbmV3IFNldDxudW1iZXI+KCk7XG5cdFx0Y29uc3QgY2h1bmtTdGFydCA9IHRoaXMucmV0cmlldmVDaHVua1N0YXJ0KG9mZnNldCk7XG5cblx0XHQvLyBJZiBpdCBkb2Vzbid0IGhhdmUgZXZlbiB0aGUgc3RhcnRpbmcgY2h1bmsgaXQgbWVhbnMgd2UgbXVzdCBoYXZlIHNjcm9sbGVkIGZhciBvdXRzaWRlIHRoZSB2aWV3cG9ydCBhbmQgd2lsbCBuZWVkIHRvIHJlcXVldCBzdGFydGluZyBjaHVua1xuXHRcdC8vIFdlIGNhbiBhZGQgdGhpcyBldmVyeXRpbWUgc2luY2Ugd2UgY29tcHV0ZSBhIHNldCBkaWZmZXJlbmNlIGxhdGVyIGl0IHdpbGwgYmUgcmVtb3ZlZFxuXHRcdGNodW5rc1RvUmVxdWVzdC5hZGQoY2h1bmtTdGFydCk7XG5cdFx0Ly8gR2V0IHRoZSBvZmZzZXRzIG9mIHRoZSBjaHVua3MgdGhhdCB3b3VsZCBtYWtlIHVwIHRoZSBidWZmZXJzXG5cdFx0Zm9yIChsZXQgaSA9IDE7IGkgPD0gYnVmZmVyT3B0cy50b3BCdWZmZXJTaXplOyBpKyspIHtcblx0XHRcdGNodW5rc1RvUmVxdWVzdC5hZGQoTWF0aC5tYXgoMCwgY2h1bmtTdGFydCAtIChpICogdGhpcy5jaHVua1NpemUpKSk7XG5cdFx0fVxuXHRcdGZvciAobGV0IGkgPSAxOyBpIDw9IGJ1ZmZlck9wdHMuYm90dG9tQnVmZmVyU2l6ZTsgaSsrKSB7XG5cdFx0XHRjaHVua3NUb1JlcXVlc3QuYWRkKGNodW5rU3RhcnQgKyAoaSAqIHRoaXMuY2h1bmtTaXplKSk7XG5cdFx0fVxuXHRcdC8vIFdlIGRvbid0IHJlcXVlc3QgY2h1bmtzIHdlIGFscmVhZHkgaGF2ZSBzbyB3ZSBmaWx0ZXIgdGhlbSBvdXQgaGVyZVxuXHRcdGNvbnN0IGNodW5rc1RvUmVxdWVzdEFycjogbnVtYmVyW10gPSBbLi4uY2h1bmtzVG9SZXF1ZXN0XS5maWx0ZXIoeCA9PiAhdGhpcy5jaHVua3MuaGFzKHgpKTtcblx0XHQvL0lmIGl0J3MgaW5zaWRlIHRoZSBidWZmZXIgKHdoaWNoIHRoZSBjaHVua3NUb1JlcXVlc3Qgc2V0IGhvbGRzKSB0aGVuIHdlIGtlZXAgaXQsIGVsc2UgaXQncyBkZWxldGVkXG5cdFx0Y29uc3QgY2h1bmtzT3V0c2lkZUJ1ZmZlcjogbnVtYmVyW10gPSBbLi4udGhpcy5jaHVua3NdLmZpbHRlcih4ID0+ICFjaHVua3NUb1JlcXVlc3QuaGFzKHgpKTtcblxuXHRcdC8vIFdlIHN0b3AgdHJhY2tpbmcgdGhlIG9sZCBjaHVua3MgYW5kIHdlIHJlcXVlc3QgdGhlIG5ldyBvbmVzXG5cdFx0Y2h1bmtzT3V0c2lkZUJ1ZmZlci5mb3JFYWNoKGNodW5rID0+IHRoaXMucmVtb3ZlQ2h1bmsoY2h1bmspKTtcblx0XHRjb25zdCByZXF1ZXN0ZWQ6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuXHRcdGNodW5rc1RvUmVxdWVzdEFyci5mb3JFYWNoKGNodW5rT2Zmc2V0ID0+IHJlcXVlc3RlZC5wdXNoKHRoaXMucmVxdWVzdE1vcmVDaHVua3MoY2h1bmtPZmZzZXQpKSk7XG5cdFx0Y29uc3QgcmVzdWx0ID0ge1xuXHRcdFx0cmVtb3ZlZDogY2h1bmtzT3V0c2lkZUJ1ZmZlcixcblx0XHRcdHJlcXVlc3RlZDogUHJvbWlzZS5hbGwocmVxdWVzdGVkKVxuXHRcdH07XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdC8qKlxuXHQgKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB0aGUgaW5jb21pbmcgY2h1bmtzIGZyb20gdGhlIGV4dGVuc2lvbiAodGhpcyBnZXRzIGNhbGxlZCBieSB0aGUgbWVzc2FnZSBoYW5kbGVyKVxuXHQgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IFRoZSBvZmZzZXQgd2hpY2ggd2FzIHJlcXVlc3RkXG5cdCAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YSBUaGUgZGF0YSB3aGljaCB3YXMgcmV0dXJuZWQgYmFja1xuXHQgKiBAcGFyYW0ge251bWJlcn0gZmlsZVNpemUgVGhlIHNpemUgb2YgdGhlIGZpbGUsIHRoaXMgaXMgcGFzc2VkIGJhY2sgZnJvbSB0aGUgZXh0aG9zdCBhbmQgaGVscHMgdG8gZW5zdXJlIHRoZSB3ZWJ2aWV3IGFuZCBleHRob3N0IHNpemVzIGFyZSBzeW5jZWRcblx0ICovXG5cdHB1YmxpYyBwcm9jZXNzQ2h1bmtzKG9mZnNldDogbnVtYmVyLCBkYXRhOiBVaW50OEFycmF5LCBlZGl0czogRWRpdE1lc3NhZ2VbXSwgZmlsZVNpemU6IG51bWJlcik6IHZvaWQge1xuXHRcdGNvbnN0IHBhY2tldHM6IFZpcnR1YWxpemVkUGFja2V0W10gPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcblx0XHRcdC8vIElmIGl0J3MgYSBjaHVuayBib3VuZGFyeSB3ZSB3YW50IHRvIG1ha2Ugc3VyZSB3ZSdyZSB0cmFja2luZyB0aGF0IGNodW5rXG5cdFx0XHRpZiAoKGkgKyBvZmZzZXQpICUgdGhpcy5jaHVua1NpemUgPT09IDApIHtcblx0XHRcdFx0dGhpcy5hZGRDaHVuayhpICsgb2Zmc2V0KTtcblx0XHRcdH1cblx0XHRcdHBhY2tldHMucHVzaCh7XG5cdFx0XHRcdG9mZnNldDogaSArIG9mZnNldCxcblx0XHRcdFx0ZGF0YTogbmV3IEJ5dGVEYXRhKGRhdGFbaV0pXG5cdFx0XHR9KTtcblx0XHRcdC8vIEF0IHRoZSB2ZXJ5IGVuZCB3ZSB3YW50IHRoZSBwbHVzIGNlbGwsIHNvIHdlIGFkZCBhIGR1bW15IHBhY2tldCB0aGF0IGlzIGdyZWF0ZXIgdGhhbiB0aGUgZmlsZXNpemVcblx0XHRcdGlmIChpICsgb2Zmc2V0ICsgMSA9PT0gdmlydHVhbEhleERvY3VtZW50LmRvY3VtZW50U2l6ZSkge1xuXHRcdFx0XHRwYWNrZXRzLnB1c2goe1xuXHRcdFx0XHRcdG9mZnNldDogaSArIG9mZnNldCArIDEsXG5cdFx0XHRcdFx0ZGF0YTogbmV3IEJ5dGVEYXRhKDApXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBJZiBpdCdzIGFuIGVtcHR5IGZpbGUgd2UganVzdCBzZW5kIG92ZXIgdGhlIGR1bW15IHBhY2tldCBmb3IgdGhlIHBsdXMgY2VsbFxuXHRcdGlmIChkYXRhLmxlbmd0aCA9PT0gMCAmJiBmaWxlU2l6ZSA9PT0gMCkge1xuXHRcdFx0cGFja2V0cy5wdXNoKHtcblx0XHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0XHRkYXRhOiBuZXcgQnl0ZURhdGEoMClcblx0XHRcdH0pO1xuXHRcdH1cblx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQucmVuZGVyKHBhY2tldHMpO1xuXHRcdHZpcnR1YWxIZXhEb2N1bWVudC5yZWRvKGVkaXRzLCBmaWxlU2l6ZSk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEFkZHMgYSBjaHVuayB3aXRoIHRoZSBnaXZlbiBjaHVuayBvZmZzZXQgdG8gdGhlIGhhbmRsZXJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBUaGUgb2Zmc2V0IHdoaWNoIGhvbGRzIHRoZSBjaHVuayBzdGFydFxuXHQgKi9cblx0cHVibGljIGFkZENodW5rKG9mZnNldDogbnVtYmVyKTogdm9pZCB7XG5cdFx0dGhpcy5jaHVua3MuYWRkKG9mZnNldCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIERlbGV0ZXMgYSBjaHVuayB3aXRoIHRoZSBnaXZlbiBjaHVuayBvZmZzZXQgdG8gdGhlIGhhbmRsZXJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBUaGUgb2Zmc2V0IHdoaWNoIGhvbGRzIHRoZSBjaHVuayBzdGFydFxuXHQgKi9cblx0cHVibGljIHJlbW92ZUNodW5rKG9mZnNldDogbnVtYmVyKTogdm9pZCB7XG5cdFx0dGhpcy5jaHVua3MuZGVsZXRlKG9mZnNldCk7XG5cdH1cblxuXHQvKipcblx0ICogQGRlc2NyaXB0aW9uIEdldHRlciBmb3IgYWxsIHRoZSBjaHVua3MgaW4gdGhlIGNodW5rIGhhbmRsZXJcblx0ICogQHJldHVybnMge1NldDxudW1lcj59IHRoZSBzdGFydGluZyBvZmZzZXRzIG9mIGFsbCB0aGUgY2h1bmtzIGJlaW5nIHRyYWNrZWRcblx0ICovXG5cdHB1YmxpYyBnZXQgYWxsQ2h1bmtzKCk6IFNldDxudW1iZXI+IHtcblx0XHRyZXR1cm4gdGhpcy5jaHVua3M7XG5cdH1cbn0iLCAiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IHZzY29kZSB9IGZyb20gXCIuL2hleEVkaXRcIjtcblxuLyoqXG4gKiBDbGFzcyB3aGljaCBoYW5kbGVzIG1lc3NhZ2VzIGJldHdlZW4gdGhlIHdlYnZpZXcgYW5kIHRoZSBleHRob3N0XG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNzYWdlSGFuZGxlciB7XG5cdHByaXZhdGUgbWF4UmVxdWVzdHM6IG51bWJlcjtcblx0cHJpdmF0ZSByZXF1ZXN0c01hcDogTWFwPG51bWJlciwgeyByZXNvbHZlOiAodmFsdWU/OiBhbnkpID0+IHZvaWQ7IHJlamVjdDogKHJlYXNvbj86IGFueSkgPT4gdm9pZCB9Pjtcblx0cHJpdmF0ZSByZXF1ZXN0SWQ6IG51bWJlcjtcblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgbmV3IE1lc3NhZ2VIYW5kbGVyXG5cdCAqIEBwYXJhbSBtYXhpbXVtUmVxdWVzdHMgVGhlIG1heGltdW0gbnVtYmVyIG9mIHJlcXVlc3RzXG5cdCAqL1xuXHRjb25zdHJ1Y3RvcihtYXhpbXVtUmVxdWVzdHM6IG51bWJlcikge1xuXHRcdHRoaXMubWF4UmVxdWVzdHMgPSBtYXhpbXVtUmVxdWVzdHM7XG5cdFx0dGhpcy5yZXF1ZXN0c01hcCA9IG5ldyBNYXA8bnVtYmVyLCB7IHJlc29sdmU6ICh2YWx1ZT86IGFueSkgPT4gdm9pZDsgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkIH0+KCk7XG5cdFx0dGhpcy5yZXF1ZXN0SWQgPSAwO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBQb3N0cyB0byB0aGUgZXh0ZW5zaW9uIGhvc3QgYSBtZXNzYWdlIGFuZCByZXR1cm5zIGEgcHJvbWlzZSB3aGljaCBpZiBzdWNjZXNzZnVsIHdpbGwgcmVzb2x2ZSB0byB0aGUgcmVzcG9uc2Vcblx0ICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgQSBzdHJpbmcgZGVmaW5pbmcgdGhlIHR5cGUgb2YgbWVzc2FnZSBzbyBpdCBjYW4gYmUgY29ycmVjdGx5IGhhbmRsZWQgb24gYm90aCBlbmRzXG5cdCAqIEBwYXJhbSB7YW55fSBib2R5IFRoZSBwYXlsb2FkXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlPGFueT59IEEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB0byB0aGUgcmVzcG9uc2Ugb3IgcmVqZWN0cyBpZiB0aGUgcmVxdWVzdCB0aW1lcyBvdXRcblx0ICovXG5cdGFzeW5jIHBvc3RNZXNzYWdlV2l0aFJlc3BvbnNlKHR5cGU6IHN0cmluZywgYm9keT86IGFueSk6IFByb21pc2U8YW55PiB7XG5cdFx0Y29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4gdGhpcy5yZXF1ZXN0c01hcC5zZXQodGhpcy5yZXF1ZXN0SWQsIHsgcmVzb2x2ZSwgcmVqZWN0IH0pKTtcblx0XHQvLyBXZSByZW1vdmUgdGhlIG9sZGVzdCByZXF1ZXN0IGlmIHRoZSBjdXJyZW50IHJlcXVlc3QgcXVldWUgaXMgZnVsbFxuXHRcdC8vIFRoaXMgZG9lc24ndCBzdG9wIHRoZSByZXF1ZXN0IG9uIHRoZSBFeHQgaG9zdCBzaWRlLCBidXQgaXQgd2lsbCBiZSBkcm9wcGVkIHdoZW4gaXQncyByZWNlaXZlZCwgd2hpY2ggbGVzc2VucyB0aGUgbG9hZCBvbiB0aGUgd2Vidmlld1xuXHRcdGlmICh0aGlzLnJlcXVlc3RzTWFwLnNpemUgPiB0aGlzLm1heFJlcXVlc3RzKSB7XG5cdFx0XHRjb25zdCByZW1vdmVkOiBudW1iZXIgPSB0aGlzLnJlcXVlc3RzTWFwLmtleXMoKS5uZXh0KCkudmFsdWU7XG5cdFx0XHR0aGlzLnJlcXVlc3RzTWFwLmdldChyZW1vdmVkKT8ucmVqZWN0KFwiUmVxdWVzdCBUaW1lZCBvdXRcIik7XG5cdFx0XHR0aGlzLnJlcXVlc3RzTWFwLmRlbGV0ZShyZW1vdmVkKTtcblx0XHR9XG5cdFx0dnNjb2RlLnBvc3RNZXNzYWdlKHsgcmVxdWVzdElkOiB0aGlzLnJlcXVlc3RJZCsrLCB0eXBlLCBib2R5IH0pO1xuXHRcdHJldHVybiBwcm9taXNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBQb3N0IHRvIHRoZSBleHRlbnNpb24gaG9zdCBhcyBhIG1lc3NhZ2UgaW4gYSBmaXJlIGFuZCBmb3JnZXQgbWFubmVyLCBub3QgZXhwZWN0aW5nIGEgcmVzcG9uc2Vcblx0ICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgQSBzdHJpbmcgZGVmaW5pbmcgdGhlIHR5cGUgb2YgbWVzc2FnZSBzbyBpdCBjYW4gYmUgY29ycmVjdGx5IGhhbmRsZWQgb24gYm90aCBlbmRzXG5cdCAqIEBwYXJhbSB7YW55fSBib2R5IFRoZSBwYXlsb2FkXG5cdCAqL1xuXHRwb3N0TWVzc2FnZSh0eXBlOiBzdHJpbmcsIGJvZHk/OiBhbnkpOiB2b2lkIHtcblx0XHR2c2NvZGUucG9zdE1lc3NhZ2UoeyB0eXBlLCBib2R5IH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBkZXNjcmlwdGlvbiBGb3IgZXZlcnkgaW5jb21pbmcgbWVzc2FnZSB0aGF0IGlzbid0IHRoZSBpbml0XG5cdCAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHJlY2VpdmVkXG5cdCAqL1xuXHRpbmNvbWluZ01lc3NhZ2VIYW5kbGVyKG1lc3NhZ2U6IGFueSk6IHZvaWQge1xuXHRcdGNvbnN0IHJlcXVlc3QgPSB0aGlzLnJlcXVlc3RzTWFwLmdldChtZXNzYWdlLnJlcXVlc3RJZCk7XG5cdFx0Ly8gV2Ugc2hvdWxkIG5ldmVyIGdldCBhIHJvZ3VlIHJlc3BvbnNlIGZyb20gdGhlIHdlYnZpZXcgdW5sZXNzIGl0J3MgYW4gaW5pdC5cblx0XHQvLyBTbyBpZiB0aGUgbWVzc2FnZSBpc24ndCBiZWluZyB0cmFja2VkIGJ5IHRoZSBtZXNzYWdlIGhhbmRsZXIsIHdlIGRyb3AgaXRcblx0XHRpZiAoIXJlcXVlc3QpIHJldHVybjtcblx0XHRyZXF1ZXN0LnJlc29sdmUobWVzc2FnZS5ib2R5KTtcblx0XHR0aGlzLnJlcXVlc3RzTWFwLmRlbGV0ZShtZXNzYWdlLnJlcXVlc3RJZCk7XG5cdH1cbn0iLCAiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IFZpcnR1YWxEb2N1bWVudCB9IGZyb20gXCIuL3ZpcnR1YWxEb2N1bWVudFwiO1xuaW1wb3J0IHsgQ2h1bmtIYW5kbGVyIH0gZnJvbSBcIi4vY2h1bmtIYW5kbGVyXCI7XG5pbXBvcnQgeyBNZXNzYWdlSGFuZGxlciB9IGZyb20gXCIuL21lc3NhZ2VIYW5kbGVyXCI7XG5cbmRlY2xhcmUgY29uc3QgYWNxdWlyZVZzQ29kZUFwaTogYW55O1xuZXhwb3J0IGNvbnN0IHZzY29kZSA9IGFjcXVpcmVWc0NvZGVBcGkoKTtcbmV4cG9ydCBsZXQgdmlydHVhbEhleERvY3VtZW50OiBWaXJ0dWFsRG9jdW1lbnQ7XG4vLyBDb25zdHJ1Y3QgYSBjaHVuayBoYW5kbGVyIHdoaWNoIGhvbGRzIGNodW5rcyBvZiA1MCByb3dzICg1MCAqIDE2KVxuZXhwb3J0IGNvbnN0IGNodW5rSGFuZGxlcjogQ2h1bmtIYW5kbGVyID0gbmV3IENodW5rSGFuZGxlcig4MDApO1xuLy8gTWVzc2FnZSBoYW5kbGVyIHdoaWNoIHdpbGwgaGFuZGxlIHRoZSBtZXNzYWdlcyBiZXR3ZWVuIHRoZSBleHRob3N0IGFuZCB0aGUgd2VidmlldyAoV2UnbGwgYWxsb3cgYSBtYXggb2YgMTAgcGVuZGluZyByZXF1ZXN0cylcbmV4cG9ydCBjb25zdCBtZXNzYWdlSGFuZGxlcjogTWVzc2FnZUhhbmRsZXIgPSBuZXcgTWVzc2FnZUhhbmRsZXIoMTApO1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBGaXJlcyB3aGVuIHRoZSB1c2VyIGNsaWNrcyB0aGUgb3BlbkFueXdheSBsaW5rIG9uIGxhcmdlIGZpbGVzXG4gKi9cbmZ1bmN0aW9uIG9wZW5Bbnl3YXkoKTogdm9pZCB7XG5cdG1lc3NhZ2VIYW5kbGVyLnBvc3RNZXNzYWdlKFwib3Blbi1hbnl3YXlzXCIpO1xufVxuXG5cbi8vIFNlbGYgZXhlY3V0aW5nIGFub255bW91cyBmdW5jdGlvblxuLy8gVGhpcyBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludFxuKCgpOiB2b2lkID0+IHtcblx0Ly8gSGFuZGxlIG1lc3NhZ2VzIGZyb20gdGhlIGV4dGVuc2lvblxuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgYXN5bmMgZSA9PiB7XG5cdFx0Y29uc3QgeyB0eXBlLCBib2R5IH0gPSBlLmRhdGE7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlIFwiaW5pdFwiOlxuXHRcdFx0XHQvLyBMb2FkcyB0aGUgaHRtbCBib2R5IHNlbnQgb3ZlclxuXHRcdFx0XHRpZiAoYm9keS5odG1sICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF0uaW5uZXJIVE1MID0gYm9keS5odG1sO1xuXHRcdFx0XHRcdHZpcnR1YWxIZXhEb2N1bWVudCA9IG5ldyBWaXJ0dWFsRG9jdW1lbnQoYm9keS5maWxlU2l6ZSwgYm9keS5lZGl0b3JGb250U2l6ZSwgYm9keS5iYXNlQWRkcmVzcyk7XG5cdFx0XHRcdFx0Ly8gV2UgaW5pdGlhbGx5IGxvYWQgNCBjaHVua3MgYmVsb3cgdGhlIHZpZXdwb3J0IChub3JtYWxseSB3ZSBidWZmZXIgMiBhYm92ZSBhcyB3ZWxsLCBidXQgdGhlcmUgaXMgbm8gYWJvdmUgYXQgdGhlIHN0YXJ0KVxuXHRcdFx0XHRcdGNodW5rSGFuZGxlci5lbnN1cmVCdWZmZXIodmlydHVhbEhleERvY3VtZW50LnRvcE9mZnNldCgpLCB7XG5cdFx0XHRcdFx0XHR0b3BCdWZmZXJTaXplOiAwLFxuXHRcdFx0XHRcdFx0Ym90dG9tQnVmZmVyU2l6ZTogNVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChib2R5LmZpbGVTaXplICE9IDAgJiYgYm9keS5odG1sID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF0uaW5uZXJIVE1MID1cblx0XHRcdFx0XHRcdGBcblx0XHRcdFx0XHRcdDxkaXY+XG5cdFx0XHRcdFx0XHQ8cD5PcGVuaW5nIHRoaXMgbGFyZ2UgZmlsZSBtYXkgY2F1c2UgaW5zdGFiaWxpdHkuIDxhIGlkPVwib3Blbi1hbnl3YXlcIiBocmVmPVwiI1wiPk9wZW4gYW55d2F5czwvYT48L3A+XG5cdFx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRgO1xuXHRcdFx0XHRcdC8vIFdlIGNvbnN0cnVjdCB0aGUgZWxlbWVudCByaWdodCBhYm92ZSB0aGlzIHNvIGl0IGlzIGRlZmluaXRlbHkgbmV2ZXIgbnVsbFxuXHRcdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3Blbi1hbnl3YXlcIikhLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvcGVuQW55d2F5KTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSBcInVwZGF0ZVwiOlxuXHRcdFx0XHRpZiAoYm9keS50eXBlID09PSBcInVuZG9cIikge1xuXHRcdFx0XHRcdHZpcnR1YWxIZXhEb2N1bWVudC51bmRvKGJvZHkuZWRpdHMsIGJvZHkuZmlsZVNpemUpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGJvZHkudHlwZSA9PT0gXCJyZWRvXCIpIHtcblx0XHRcdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQucmVkbyhib2R5LmVkaXRzLCBib2R5LmZpbGVTaXplKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2aXJ0dWFsSGV4RG9jdW1lbnQucmV2ZXJ0KGJvZHkuZmlsZVNpemUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGNhc2UgXCJzYXZlXCI6XG5cdFx0XHRcdGNvbnN0IGRpcnR5Q2VsbHMgPSBBcnJheS5mcm9tKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJlZGl0ZWRcIikpO1xuXHRcdFx0XHRkaXJ0eUNlbGxzLm1hcChjZWxsID0+IGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcImVkaXRlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGNhc2UgXCJnb1RvT2Zmc2V0XCI6XG5cdFx0XHRcdC8vIENvbnZlcnQgdGhlIGhleCBvZmZzZXQgZ2l2ZW4gdG8gYmFzZSAxMFxuXHRcdFx0XHRjb25zdCBvZmZzZXQgPSBwYXJzZUludChib2R5Lm9mZnNldCwgMTYpO1xuXHRcdFx0XHQvLyBTY3JvbGwgdG8gdGhlIG9mZnNldCBhbmQgZm9jdXMgdGhlIGNlbGxcblx0XHRcdFx0dmlydHVhbEhleERvY3VtZW50LnNjcm9sbERvY3VtZW50VG9PZmZzZXQob2Zmc2V0KS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHQvLyBIYXZlIHRvIGhhdmUgYSAxMG1zIGRlbGF5IG9yIHRoZSBmb2N1cyBib3JkZXIgZG9lc24ndCBzZXQgY29ycmVjdGx5XG5cdFx0XHRcdFx0Ly8gTXkgaHlwb3RoZXNpcyBpcyB0aGlzIGlzIGNhdXNlZCBieSB0aGUgaW5wdXQgYm94IGNsb3NpbmcgYXQgdGhlIHNhbWUgdGltZSBhcyB3ZSBzZXQgZm9jdXNcblx0XHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHZpcnR1YWxIZXhEb2N1bWVudC5mb2N1c0VsZW1lbnRXaXRoR2l2ZW5PZmZzZXQob2Zmc2V0KSwgMTApO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0bWVzc2FnZUhhbmRsZXIuaW5jb21pbmdNZXNzYWdlSGFuZGxlcihlLmRhdGEpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBTaWduYWwgdG8gVlMgQ29kZSB0aGF0IHRoZSB3ZWJ2aWV3IGlzIGluaXRpYWxpemVkLlxuXHRtZXNzYWdlSGFuZGxlci5wb3N0TWVzc2FnZShcInJlYWR5XCIpO1xufSkoKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBR08sdUJBQWU7QUFBQSxJQVFyQixZQUFZLFVBQWtCO0FBQzdCLFdBQUssVUFBVTtBQUNmLFdBQUssZ0JBQWdCO0FBQUE7QUFBQSxJQU90QixnQkFBZ0IsVUFBMEI7QUFDekMsV0FBSyxjQUFjLEtBQUs7QUFBQTtBQUFBLElBT3pCLFFBQWdCO0FBQ2YsYUFBTyxLQUFLLFFBQVEsU0FBUyxJ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
