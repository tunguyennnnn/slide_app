function MathBlock($parentDom){
  var DEFAULT_BLOCK_SIZE = 30;
  var self = this;
  this.$parentDom = $parentDom;
  $parentDom.append(mathBlockHtml());
  this.$container = $parentDom.find('.math-block-container');
  this.$body = this.$container.find('.math-block-body');
  this.$mirror = this.$container.find('.math-block-mirror');
  this.$cover = this.$container.find('.math-block-cover');

  this.textEditor = new Quill(this.$body.get(0));
  this.$editorBody = this.$body.find('.ql-editor');
  this.currentMathId = null;
  this.hide();
  function mathBlockHtml(){
    var html = '';
    html += '<div class="math-block-container">'
    html +=   '<div class="math-block-cover"></div>'
    html +=   '<div class="math-block-body"></div>'
    html +=   '<span class="math-block-mirror" style="display: none"></span>'
    html += '</div>'
    return html;
  }

  function onTextChange(){
    var editor = self.textEditor;
    editor.on('text-change', function(delta, oldContent, source){
      if (source === 'user'){
        var changeObject = (delta.ops[1] ? delta.ops[1] : delta.ops[0]);
        var fullText = editor.getText();
        self.$mirror.text(fullText);

        if (self.$mirror.css('width').pixelToInt() >= DEFAULT_BLOCK_SIZE){
          self.$container.get(0).style.removeProperty('width');
        }
        else{
          self.$container.css('width', DEFAULT_BLOCK_SIZE);
        }
      }
    });
  }
  onTextChange();

  function onBlur(){

    self.$editorBody.on('blur', function(){
      self.hide();
    });
  }
  onBlur();

}

MathBlock.prototype.focus = function(pos){
  var self = this;
  var pos = pos || 0;
  setTimeout(function(){
    self.textEditor.focus();
    self.textEditor.setSelection(pos, 0);
  }, 0);
}

MathBlock.prototype.applyPosition = function(position){
  this.$container.css('top',position.top - 22);
  this.$container.css('left',position.left);
}

MathBlock.prototype.show = function(position, applyMath, backFunction, math){
  var self = this;
  var selection = 0;
  if (!math || math === ''){
    this.textEditor.setText('\\');
    selection = 1;
  }else{
    this.textEditor.setText(math);
    selection = math.length - 1;
  }
  this.$container.show();
  this.focus(selection);
  this.applyPosition(position);
  var editor = this.textEditor;
  editor.on('text-change', handleMath);
  function handleMath(delta, oldContent, source){
    if (source === 'user'){
      var fullText = editor.getText();
      applyMath(fullText)
      var changeObject = (delta.ops[1] ? delta.ops[1] : delta.ops[0]);
      if (changeObject.insert){
        var keyPress = changeObject.insert;
        if (keyPress === '\n' || keyPress === '\t'){
          backFunction(fullText !== '\n');
          editor.off('text-change', handleMath);
          self.hide();
        }
      }
      else if (changeObject.delete){
        if (fullText === '\n'){
          backFunction(false);
          editor.off('text-change', handleMath);
          self.hide();
        }
      }
    }
  }
}

MathBlock.prototype.hide = function(){
  this.textEditor.setText('')
  this.$container.hide();
}

MathBlock.prototype.getTreeJson = function(){
  var self = this;
  var treeId = 'math-block-tree-' + this._id;
  var action = function(){
    $(document).on('mouseenter', '#' + treeId, function(){
      self.$cover.show();
    }).on('mouseleave','#' + treeId, function(){
      self.$cover.hide()
    });
  }
  return [{
    id          : this._id,
    text        : '<span id="' + treeId + '"> Math block-' + this._id + '</span>',
    icon        : 'fa fa-header',
    state       : {
      opened    : true,
      disabled  : false,
      selected  : false
    },
    children    : [],
    li_attr     : {},
    a_attr      : {}
  }, action]
}
