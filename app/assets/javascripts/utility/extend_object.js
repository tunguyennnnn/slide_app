//////////// Quillll

Quill.prototype.getNumberOfLines = function(){
  return this.getText().match(/\n/g).length;
}

Quill.prototype.getTextAt = function(index){
  // legal index from 1 to n
  // if out of range return empty string
  if (index > this.getNumberOfLines() || index <= 0){
    return "";
  }
  else{
    var newLineIndexes = $.merge([-1], this.getText().indexesOf('\n'));
    return this.getText(newLineIndexes[index - 1] + 1, newLineIndexes[index]);
  }
}

Quill.prototype.appendEmptyLines = function(numberOfLine){
  var numberOfLine = numberOfLine || 1;
  var html = this.getHTML();
  for (var i = 0; i < numberOfLine; i++){
    html += '<div><br></div>'
  }
  this.setHTML(html);
}

Quill.prototype.getCurrentLineSelection = function(){
  var newLineIndexes = $.merge([-1], this.getText().indexesOf('\n'));
  var currentIndex = this.getSelection().end;
  for (var i = 1; i < newLineIndexes.length; i++){
    if (currentIndex >=  newLineIndexes[i-1] && currentIndex <= newLineIndexes[i]){
      return i;
    }
  }
  return -1;
}

Quill.prototype.isEmpty = function(index){
  return this.getTextAt(index) == '';
}

Quill.prototype.matchLine = function(fn){
  var accumulator = []
  for (var i = 1; i <= this.getNumberOfLines(); i++ ){
    var result = fn(this.getTextAt(i));
    if (result){
      accumulator.push([i,result]);
    }
  }
  return ((accumulator.length > 0) ? accumulator : null);
}

Quill.prototype.matchMultilines = function(startRegex, endRegex){
  var accumulator = [];
  var start = null;
  var end = null;
  for (var i = 1; i <= this.getNumberOfLines(); i++){
    if (startRegex.test(this.getTextAt(i))){
      start = i;
    }
    if (endRegex.test(this.getTextAt(i))){
      end = i;
      if (start && end){
        accumulator.push([start, end]);
      }
      start = null;
      end = null;
    }
  }
  return accumulator;
}

Quill.prototype.matchInlineCode = function(){
  var accumulator = [];
  for (var index = 0; index < Utility.languages.length; index ++){
    var languageName = Utility.languages[index];
    var matchRegex = new RegExp('@'+languageName + '{.+}@' + languageName);
    for (var i = 1; i <= this.getNumberOfLines(); i++){
      if (matchRegex.test(this.getTextAt(i))){
        var tmp = {}
        tmp[languageName] = i;
        accumulator.push(tmp);
      }
    }
  }
  return accumulator;
}

Quill.prototype.matchMultilinesCode = function(){
  var accumulator = [];
  for (var index = 0; index < Utility.languages.length; index++){
    var language = Utility.languages[index];
    var startRegex = new RegExp(language + "{");
    var endRegex = new RegExp("}" + language);
    var start = null;
    var end = null;
    for (var i = 1; i <= this.getNumberOfLines(); i++){
      if (startRegex.test(this.getTextAt(i))){
        start = i;
      }
      if (endRegex.test(this.getTextAt(i))){
        end = i;
        if (start && end){
          var temp = {};
          temp[language] = [start, end];
          accumulator.push(temp);
        }
        start = null;
        end = null;
      }
    }
  }
  return accumulator;
}

Quill.prototype.deleteLine = function(index){
  if (index <= 0 || index > this.getNumberOfLines() || this.getNumberOfLines() == 1){
    return null;
  }
  var new_line_indexes = $.merge([-1], this.getText().indexesOf('\n'));
  this.deleteText(new_line_indexes[index-1], new_line_indexes[index]);
}

// remove start to end, add new text
Quill.prototype.replaceText = function(start, end, text){
  this.deleteText(start, end);
  return this.insertText(start, text);
}

Quill.prototype.setTextAt = function(lineNumber, text){
  if (lineNumber <= 0 || lineNumber > this.getNumberOfLines()){
    return null;
  }
  var newLineIndexes = $.merge([-1], this.getText().indexesOf('\n'));
  var start =  newLineIndexes[lineNumber - 1];
  var end = newLineIndexes[lineNumber]
  if (start == end - 1){
    return this.replaceText(start + 1, start + 1, text);
  }
  else{
    return this.replaceText(newLineIndexes[lineNumber - 1] + 1, newLineIndexes[lineNumber] - 1, text);
  }
}

Quill.prototype.addLineAndSetText = function(lineNumber, text){
  if (lineNumber < 0 || lineNumber > (this.getNumberOfLines())){
    return null;
  }
  var newLineIndexes = $.merge([-1], this.getText().indexesOf('\n'));
  if (lineNumber == 0){
    this.replaceText(0, 0, text + '\n');
    var selection = text.length;
  }
  else if(lineNumber == this.getNumberOfLines()){
    this.appendEmptyLines();
    this.setTextAt(lineNumber + 1, text);
    var selection = newLineIndexes.last() + text.length + 1
  }
  else{
    this.replaceText( newLineIndexes[lineNumber], newLineIndexes[lineNumber], '\n' + text);
    var selection = newLineIndexes[lineNumber] + text.length + 1;
  }
  this.setSelection(selection, selection);
}

Quill.prototype.getIndex = function(index){
  var newLineIndexes = $.merge([-1], this.getText().indexesOf('\n'));
  for (var i = 0; i < newLineIndexes.length - 1; i++){
    if (newLineIndexes[i] < index && newLineIndexes[i + 1] >= index){
      return {position: (index - newLineIndexes[i] - 1), line: (i + 1)};
    }
  }
}

Quill.prototype.insertHtml = function(html, index){
  var childEl = $.parseHTML(this.getHTML());
  var currentIndex = this.getIndex(index);
  var selectedChild = childEl[currentIndex.line - 1]
  APPDOM.insertHTML(selectedChild, currentIndex.position, html);
  this.$editorBody.children()[currentIndex.line - 1].outerHTML = selectedChild.outerHTML;
}

Quill.prototype.findRangeById = function(domId){
  var childEl = $.parseHTML(this.getHTML());
}

Quill.prototype.positionOfMath = function(mathId){
  var childEls = $.parseHTML(this.getHTML());
  var currentPosition = 0;
  for (var i = 0; i < childEls.length; i ++){
    var mathPosition = APPDOM.findPosition(childEls[i], mathId);
    if (mathPosition){
      return {start: mathPosition.start + currentPosition, end: (mathPosition.end + currentPosition)}
    }
    else{
      currentPosition += $(childEls[i]).text().length + 1;
    }
  }
}
//-----------------String extension----------------
//method find all indexes of occuring str
String.prototype.indexesOf = function(str){
  if (this.indexOf(str) == -1){
    return []
  }
  else{
    var index_list = [];
    var offset = str.length;
    var index = 0
    while (this.indexOf(str, index) != -1){
      var occurence_index = this.indexOf(str, index);
      index_list.push(this.indexOf(str, index));
      index = occurence_index + offset;
    }
    return index_list;
  }
}



String.prototype.camelize = function(){
  var newString = ""
  $.each(this.split(/[\s_-]+/), function(index, aString){
    newString += aString.charAt(0).toUpperCase() + aString.slice(1);
  });
  return newString;
}

String.prototype.toFuncName = function(){
  var newString = ""
  $.each(this.split(/[\s_-]+/), function(index, aString){
    if (! index == 0){
      newString += aString.charAt(0).toUpperCase() + aString.slice(1);
    }else{
      newString += aString
    }
  });
  return newString;
}

String.prototype.pixelToInt = function(){
  return parseInt(this.slice(0,-2));
}

//------------Array extension ---------------
Array.prototype.last = function(){
  return this[this.length-1];
}

// non destructive function
Array.prototype.insertAt = function(position, item){
  if (position <= 0){
    return [item].concat(this)
  }
  else if (position >= this.length){
    this.push(item);
    return this;
  }
  else{
    return this.slice(0, position).concat([item]).concat(this.slice(position, this.length));
  }
}

Array.prototype.isEmpty = function(){
  return this.length === 0;
}


Array.prototype.removeAt = function(index){
  if (!index || index < 0 || index >= this.length) return null;
  else return this.splice(index, index+1)[0];
}


///----------extend quill

Quill.prototype.getHTML = function(){
  return this.$editorBody.html();
}

Quill.prototype.setHTML = function(html){
  html = html || '<p><br></p>'
  this.$editorBody.html(html);
  return this;
}
Quill.prototype.getTextAt = function(index){
  // legal index from 1 to n
  // if out of range return empty string
  if (index > this.getLength() || index <= 0){
    return '';
  }

  return this.$editorBody.children().eq(index - 1).text();
}

Quill.prototype.appendLine = function(numberOfLine){
  var numberOfLine = numberOfLine || 1;
  var html = this.getHTML();
  for (var i = 0; i < numberOfLine; i++){
    html += '<p><br></p>'
  }
  this.setHTML(html);
}


Quill.prototype.deleteLine = function(index){
  // legal index: 1 .. length of lines
  var index = index || this.getLength();
  if (index <= 0 || index > this.getLength() || this.getLength() == 1){
    return;
  }
  var elements = $.parseHTML(this.getHTML());
  if (elements){
    ret = elements.pop(index - 1);
    this.setHTML(elements);
    return ret
  }
}


///------------------jQuery extension------------------
jQuery.fn.tagName = function(){
  return this.prop('tagName');
}


// utillities
function cross_list(lst1, lst2){
  //not every efficient -> but works fine for small lists -> will be fixed
  var result = [];
  i = 0;
  while (true){
    if (i >= lst1.length && i >= lst2.length){
      return result;
    }else if (i >= lst1.length){
      result.push(lst2[i])
    }else if (i >= lst2.length){
      result.push(lst1[i])
    }
    else{
      result.push(lst1[i]);
      result.push(lst2[i]);
    }
    i++;
  }
}


function walkTheDomRecursive(func, node, depth, returnedFromParent){
  var root = node || window.document;
  var returnedFromParent = func.call(root, depth++, returnedFromParent);
  var node = root.firstChild;
  while(node){
    walkTheDomRecursive(func, root.childNodes(), depth, returnedFromParent);
    node = node.nextSibling();
  }
}



// provide pdf conversion functions
$(function(){
  if (!window.pdf) { window['pdf'] = {}}

  function extract($node, func){
    var result = {};
    var func = func || function(v){ return v;}
    result.elementInfo = func($node);
    var children = $node.children();
    if (children.length != 0){
      result.children = {}
      children.each(function (index, child){
        result.children[index] = extractToPDF($(child), func);
      });
    }
    return result;
  }
  window['pdf']['extract'] = extract;

  function pdfBlockInfo(node){
    var result = {};
    result.nodeName = node.nodeName;
    if (result.nodeName == '#text'){
      result.value = node.data;
      return result;
    }
    else{
      result.css = node.style;
      return result
    }
  }
  window['pdf']['pdfBlockInfo'] = pdfBlockInfo;
});

$(function(){
  if (! window.APPDOM){
    window['APPDOM'] = {};
  }

  window['APPDOM']['node'] = {
    ELEMENT_NODE                :1,
    ATTRIBUTE_NODE              :2,
    TEXT_NODE                   :3,
    CDATA_SECTION_NODE          :4,
    ENTITY_REFERENCE_NODE       :5,
    ENTITY_NODE                 :6,
    PROCESSING_INSTRUCTION_NODE :7,
    COMMENT_NODE                :8,
    DOCUMENT_NODE               :9,
    DOCUMENT_TYPE_NODE          :10,
    DOCUMENT_FRAGMENT_NODE      :11,
    NOTATION_NODE               :12
  }

  function insertHTML(node, textPosition, html){
    if (node.childNodes.length === 0 || (node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR')){
      node.innerHTML = html;
    }
    else{
      $.each(node.childNodes, function(index, childNode){
        if (childNode.nodeType == APPDOM.node.TEXT_NODE){
          if (childNode.length >= textPosition){
            childNode.replaceData(textPosition, 0, html);
            $.each($.parseHTML(childNode.textContent), function(index, new_node){
              node.insertBefore( new_node, node.childNodes[index]);
            });
            node.removeChild(childNode);
            return false;
          }
          else{
            textPosition = textPosition - childNode.length;
          }
        }
        else{
          if (childNode.textContent.length >= textPosition){
            insertHTML(childNode, textPosition, html);
            return false;
          }
          else{
            textPosition = textPosition - childNode.textContent.length;
          }
        }
      });
    }
  }
  window['APPDOM']['insertHTML'] = insertHTML;

  function findPosition(element, id){
    var textLength = 0;
    var start = undefined;
    var end = undefined;
    function recur(element){
      var children = element.childNodes;
      $.each(children, function(index, child){
        if (child.nodeType === APPDOM.node.TEXT_NODE){
          textLength += child.textContent.length;
        }
        else{
          if (child.getAttribute('id') === id){
            start = textLength;
            end =  textLength + $(child).text().length;
          }
        }
      });
    }
    recur(element);
    if (start !== undefined){
      return {start: start, end: end}
    }
  }
  window['APPDOM']['findPosition'] = findPosition;

  function maxHeightWidth($blocks){
    // find max right and bottom positions of block
    var max_right_position = 0;
    var max_bottom_position = 0;
    $.each($blocks, function(index, block){
      var bottom_position = $(block).position().top + $(block).outerHeight();
      var right_position = $(block).position().left + $(block).outerWidth();
      max_right_position = ((max_right_position < right_position) ? right_position : max_right_position);
      max_bottom_position = ((max_bottom_position < bottom_position) ? bottom_position : max_bottom_position);
    })
    return [max_right_position, max_bottom_position]
  }
  window['APPDOM']['maxHeightWidth'] = maxHeightWidth;

});
