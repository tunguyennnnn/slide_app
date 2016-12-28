function TextEditorState(defaultState){
  this.state = defaultState || 'TEXT';
  this.lastState = 'TEXT'
  this.completeWord = '';
  this.allowedState = ['TEXT', 'CODE', 'MATH', 'PRECODE', 'PREMATH', 'AUTOCOMPLETE', 'COMPLETE', 'PASTINGHTML'];
  this.html = ''
  this.lastHtml = ''
  this.index = 0;
  this.lastIndex = 0;
}

TextEditorState.prototype.changeState = function(newState){
  newState = newState.toUpperCase()
  if (this.allowedState.includes(newState)){
    this.lastState = this.state;
    this.state = newState;
    return true;
  }
  return false;
}

TextEditorState.prototype.updateHtml = function(newHtml){
  this.lastHtml = this.html;
  this.html = newHtml;
  return true;
}

TextEditorState.prototype.updateIndex = function(newIndex){
  this.lastIndex = this.index;
  this.index = newIndex;
  return true;
}
