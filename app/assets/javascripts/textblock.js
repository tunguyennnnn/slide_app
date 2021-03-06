var x;
function TextBlocks(textblockObject, slide){
  // initialize:
  var self = this;
  this.id = textblockObject.id;
  this.css = JSON.parse(textblockObject.block_css);
  this.htmlContent = textblockObject.html_content;
  slide.$slideBody.append(text_block_html_generator(this.id));
  this.$block = $('#text-block-container-' + this.id);
  this.$closeButton = this.$block.find('.close-block-icon');
  this.$drag = this.$block.find('.text-block-drag');
  this.$reviewButton = this.$block.find('.review-block-icon');
  this.$body = this.$block.find('.text-block-body');
  this.$review = this.$block.find('.text-block-body-mirror');
  this.$toolbar = this.$block.find('.textblock-toolbar');

  // initialize quill
  this.textEditor = new Quill(this.$body.get(0), {
    modules: {
      formula: true,          // Include formula module
      syntax: true
    },
  });
  x = self;
  this.$editorBody = this.$block.find('.ql-editor').first();
  this.textEditor.$editorBody = this.$editorBody;
  this.applyCss();
  this.applyHtml();

  //init Math
  this.mathReviewer = new MathBlock(this.$block);
  this._mathId = 0;

  this.state = new TextEditorState();

  function text_block_html_generator(id){
    var html = '<div class="text-block-container" id="text-block-container-' + id + '">'
    html +=     '<div class="textblock-toolbar">'
    html +=       '<div class="close-block-icon"><i class="fa fa-close"></i></div>'
    html +=       '<div class="review-block-icon"><i class="fa fa-refresh fa-pulse fa-1x fa-fw"></i></div>'
    html +=       '<div class="copy-paste-icon"><i class="fa fa-copy"></i></div>'
    html +=       '<div class="add-image-icon"><i class="fa fa-picture-o"></i></div>'
    html +=       '<div class="text-block-drag"></div>'
    html +=     '</div>'
    html +=     '<div class="text-block-body">'
    html +=     '</div>'
    html +=     '<div class="text-block-body-mirror ql-container"></div>'
    html +=     '<div class="text-block-cover"></div>'
    html +=   '</div>'
    return html;
  }


  ///// init code
  function initCode(){
    self.$body.append('<span class="fa fa-close code-block-close-icon"></span>');
    self.$closeCodeIcon = self.$body.find('.code-block-close-icon');
    self.$editorBody.find('pre').each(function(i, block) {
      hljs.highlightBlock(block);
      var hoverIcon = false;
      var hoverCodeBlock = false
      $(this).on('mouseenter', function(){
        var that = this;
        hoverCodeBlock = true;
        self.$closeCodeIcon.show();
        self.$closeCodeIcon.css('top', $(this).position().top);
        self.$closeCodeIcon.css('left', $(this).width() + $(this).position().left);
        self.$closeCodeIcon.off().on('click', function(){
          $(that).replaceWith("<p>''</p>");
          $(this).hide();
        }).on('mouseenter', function(){
          $(this).show();
          hoverIcon = true;
        }).on('mouseleave', function(){
          hoverIcon = false;
          if (!hoverCodeBlock){
            $(this).hide();
          }
        });
      }).on('mouseleave', function(){
        if (!hoverIcon){
          self.$closeCodeIcon.hide();
          hoverCodeBlock = false;
        }
      })
    });
  }
  initCode();

  ////// init math
  function populateMath(){
    var $mathEls = self.$editorBody.find('.ql-formula');
    $mathEls.each(function(index, mathEl){
      var $mathEl = $(mathEl);
      $mathEl.addClass('math-block-' + self._mathId);
      self.mathId++;
      $mathEl.on('click', function(){
        setTimeout(function(){
          var selection = self.textEditor.getSelection().index;
          self.mathReviewer.show($mathEl.position(), applyMath($mathEl), afterMath($mathEl, selection-1), $mathEl.attr('data-value'));
        }, 0)
      })
    });
  }
  populateMath();

  //////// init auto complete
  function initAutocomplete(){
    self.autoComplete = new autocomplete({
      selector: self.$body[0],
      minChars: 2,
      source: function(term, suggest){
        term = term.toLowerCase();
        var choices = hljs.listLanguages();
        var matches = [];
        for (i=0; i<choices.length; i++)
            if (~choices[i].toLowerCase().indexOf(term)) matches.push(choices[i]);
        suggest(matches);
      },
      onSelect: function(e, term, item){
        console.log(term);
      }
    });
  }
  initAutocomplete();


  function showHideButtons(){
    self.$block.on('mouseenter', function(){
      self.$toolbar.show();
    }).on('mouseleave', function(){
      self.$toolbar.hide();
    });
  }
  showHideButtons();

  function intializeCloseButton(){
    self.$closeButton.on('click', function(e){
      var url = window.location.pathname + '/slides/1/textblocks/' + self.id;
      $.ajax({
        url: url,
        type: 'DELETE',
        success: function(data){
          self.$block.remove();
        }
      });
      e.stopPropagation();
    });
  }
  intializeCloseButton();


  //-------------handle dragging
  function handleBlockDragging(){
    self.$block.draggabilly({
      handle: '.text-block-drag',
      containment: '#slide-body',
    }).on('dragMove', function(){
      self.$toolbar.show();
    }).on('dragEnd', function(event, pointer){
      self.updateToServer({update_data: {css: {top: self.$block.css('top'), left: self.$block.css('left')}}})
    }).css('position', 'absolute');
  }
  handleBlockDragging();



  //------------handle resizing -----------------
  function handleBlockResizing(){
    var originalHeight, minHeight, blocks, padding, borderSize;
    var MIN_PADDING = 12
    var ALINE_HEIGHT = 18;
    self.$block.resizable({
      minWidth: 150,
      containment: '#slide-body',
      start: function(event, ui){
        borderSize = $(this).css('border-width').pixelToInt();
        originalHeight = ui.size.height;
        padding = self.$editorBody.css('padding-bottom').pixelToInt();
        minHeight = originalHeight;
        if (padding > MIN_PADDING){
          minHeight -= (padding - MIN_PADDING);
        }
        for (var i = self.textEditor.getNumberOfLines(); i > 0; i--){
          var text = self.textEditor.getTextAt(i);
          if (text === ''){
            if (i == 1) break;
            minHeight -= ALINE_HEIGHT;
          }
          else{
            break;
          }
        }
      },
      resize: function(event, ui){
        if (ui.size.height <= minHeight){
          $(this).css('height', minHeight - borderSize*2);
        }
      },
      stop: function(event, ui){
        var diff;
        if (ui.size.height < originalHeight){
          if (ui.size.height <= minHeight){
            diff = originalHeight - minHeight;
          }
          else{
            diff = originalHeight - ui.size.height;
          }
          while (diff > ALINE_HEIGHT){
            self.textEditor.deleteLine();
            diff -=  ALINE_HEIGHT;
          }
          if (ui.size.height <= minHeight){
            self.$editorBody.css('padding-bottom', 12);
          }
          else{
            var remaining = padding - diff;
            if (remaining < MIN_PADDING){
              self.textEditor.deleteLine();
              remaining += ALINE_HEIGHT;
            }
            self.$editorBody.css('padding-bottom', remaining );
          }
        }
        else if (ui.size.height > originalHeight){
          diff = ui.size.height - originalHeight;
          while (diff > ALINE_HEIGHT){
            self.textEditor.appendLine();
            diff -= ALINE_HEIGHT;
          }
          var remaining = diff + padding;
          if (remaining > ALINE_HEIGHT + MIN_PADDING){
            remaining -= ALINE_HEIGHT;
            self.textEditor.appendLine();
          }
          self.$editorBody.css('padding-bottom', remaining);
        }

        this.style.removeProperty('height');
        self.updateToServer({update_data:
                                { html: self.textEditor.getHTML(),
                                  css: { padding_bottom: self.$editorBody.css('padding-bottom'),
                                         width: self.$body.css('width')}}})
      }
    });
  }
  handleBlockResizing();

  ///////////////////// handle editor typing/////////////////////

  function onKeyPress(){
    var typingTimer;
    var typingInterval = 1000;
    self.$editorBody.off().on('keydown', function(e){
      var keyCode = window.event ? e.keyCode : e.which;
      if (self.state.state === 'AUTOCOMPLETE' || self.state.state === 'COMPLETE'){
        if (keyCode == 40 || keyCode == 38){
          e.preventDefault();
          self.state.changeState('COMPLETE');
          self.state.completeWord = self.autoComplete.keyPress(keyCode);
        }
        else if (keyCode == 27){
          e.preventDefault();
          self.state.changeState('TEXT');
          self.autoComplete.keyPress(keyCode);
        }
      }else if (self.state.state === 'MATH-AUTOCOMPLETE' || self.state.state === 'MATH-COMPLETE'){
        if (keyCode == 40 || keyCode == 38){
          e.preventDefault();
          self.state.changeState('MATH-COMPLETE');
          self.state.completeWord = self.autoComplete.keyPress(keyCode);
        }
        else if (keyCode == 27){
          e.preventDefault();
          self.state.changeState('TEXT');
          self.autoComplete.keyPress(keyCode);
        }
      }
      else if (self.state.state === 'CODE-AUTOCOMPLETE' || self.state.state === 'CODE-COMPLETE'){
        if (keyCode == 40 || keyCode == 38){
          e.preventDefault();
          self.state.changeState('CODE-COMPLETE');
          self.state.completeWord = self.autoComplete.keyPress(keyCode);
        }
        else if (keyCode == 27){
          e.preventDefault();
          self.state.changeState('TEXT');
          self.autoComplete.keyPress(keyCode);
        }
      }
    });

    self.textEditor.on('text-change', function(delta, oldContent, source){
      clearTimeout(typingTimer);
      typingTimer = setTimeout(finishedTyping, typingInterval);
      if (source === 'user' && self.state.state !== 'PASTINGHTML'){
        ///Store to server
        self.state.updateHtml(self.textEditor.getHTML());
        var changeObject = (delta.ops[1] ? delta.ops[1] : delta.ops[0]);
        if (self.textEditor.getSelection()){
          self.state.updateIndex(self.textEditor.getSelection().index);
          var currentState = determineState();
          switch (currentState){
            case 'PREMATH':
              self.state.changeState(currentState);
              if (changeObject.insert){
                handlePreMath();
              }
              break;
            case 'PRECODE':
              self.state.changeState(currentState);
              if (changeObject.insert){
                handlePreCode();
              }
              break;
            case 'CODE':
              if (changeObject.insert){
                handleInsertCode();
              }else{
                handleDeleteCode(changeObject.delete, oldContent);
              }
              break;
            case 'TEXT':
              self.state.changeState(currentState);
              if (changeObject.insert){
                handleInsertingText(changeObject.insert);
              }
              else{
                handleDeletingText(changeObject.delete, oldContent);
              }
              break;
          }
        }
      }
    });

    self.textEditor.on('selection-change', function(range, oldRange, source){
      if (source === 'user' && self.state.state !== 'PASTINGHTML'){
        console.log(333);
      }
    })

  }
  onKeyPress();

  function handleInsertingText(keyPress){
    var index = self.textEditor.getSelection().index;
    if (keyPress === '\n' || keyPress === '\t'){
      if (self.state.state === 'TEXT' && self.state.lastState === 'COMPLETE'){

        // prevent text-change event fired
        self.state.changeState('PASTINGHTML');
        self.autoComplete.hideAuto();
        // the word previously typed
        index--;
        var oldWord = self.textEditor.getCurrentWord(index);

        // recover old content
        self.textEditor.setHTML(self.state.lastHtml);

        // replace old word with autocomplete word
        var startIndex = index - oldWord.length;
        var newIndex = startIndex + self.state.completeWord.length;
        self.textEditor.deleteText(startIndex, oldWord.length);
        self.textEditor.insertText(startIndex, self.state.completeWord);
        setTimeout(function(){
          self.textEditor.setSelection(newIndex);
          self.state.changeState('TEXT');
        }, 0)
      }
      else if (self.state.state === 'TEXT' && self.state.lastState === 'MATH-COMPLETE'){
        self.state.changeState('PASTINGHTML');
        self.autoComplete.hideAuto();
        index--;
        self.textEditor.deleteText(index, 1);
        setTimeout(function(){
          self.textEditor.setSelection(index);
          handleMath(self.state.completeWord === 'inline math');
        }, 0);
      }
      else if (self.state.state === 'TEXT' && self.state.lastState === 'CODE-COMPLETE'){
        self.state.changeState('PASTINGHTML');
        self.autoComplete.hideAuto();
        index--;
        self.textEditor.deleteText(index, 1);
        setTimeout(function(){
          self.textEditor.setSelection(index);
          generateCodeBlock()
        }, 0);
      }
    }else{
      var lineInfo = self.textEditor.getIndex(index);
      var word = self.textEditor.getCurrentWord();
      var bound = self.textEditor.getBounds(index);
      if (word.length > 1){
        self.state.changeState('AUTOCOMPLETE');
        self.autoComplete.showAuto(word, {top: bound.bottom, left: bound.left});
      }else{
        self.state.changeState('TEXT');
        self.autoComplete.hideAuto();
      }
    }
  }

  function handleDeletingText(deletedText, oldContent){
    var selection = self.textEditor.getSelection();
    var word = self.textEditor.getCurrentWord(selection.index);
    var bound = self.textEditor.getBounds(selection.index);
    if (word.length > 1){
      self.state.changeState('AUTOCOMPLETE');
      self.autoComplete.showAuto(word, {top: bound.bottom, left: bound.left});
    }else{
      self.state.changeState('TEXT');
      self.autoComplete.hideAuto();
    }
  }

  function handlePreMath(){
    var selection = self.textEditor.getSelection();
    var bound = self.textEditor.getBounds(selection.index);
    self.autoComplete.showAuto("", {top: bound.bottom, left: bound.left}, ['inline math', 'new line math']);
    self.state.changeState('MATH-AUTOCOMPLETE');
  }

  function handleMath(inline){
    var selection = self.textEditor.getSelection();
    self.state.changeState('PASTINGHTML');
    self.textEditor.deleteText(selection.index - 2, 2);
    var newId = 'math-element-' + self._mathId;
    self._mathId++;
    self.textEditor.insertHtml('<span class="ql-formula '+ newId +'" contenteditable="false"> </span>', selection.index - 2);
    var $newMath = self.$editorBody.find('.' + newId).first();
    self.mathReviewer.show($newMath.position(), applyMath($newMath, inline), afterMath($newMath, selection.index - 2));
  }

  function applyMath($element,inline){
    return function applyMath(text){
      $element.attr('data-value', text.replace('\n', ''));
      katex.render(text, $element[0], {displayMode: inline, throwOnError: false})
    }
  }

  function afterMath($element, startPosition){
    return function(hasMath){
      setTimeout(function(){
        if (hasMath){
          $element.attr('data-value', $element.attr('data-value').replace('\n', ''));
          self.textEditor.insertText(startPosition+1, ' ')
          self.textEditor.setSelection(startPosition + 2);
          $element.off().on('click', function(){
            self.mathReviewer.show($element.position(), applyMath($element), afterMath($element,self.textEditor.getSelection().index - 1), $element.attr('data-value'))
          })
        }
        else{
          $element.remove();
          self.textEditor.setSelection(startPosition);
        }
        self.state.changeState('TEXT');
      }, 0)
    }
  }

  function handleTypingMath(){
    var PREMATH_LENGTH = 2;
    var MATH_SYMBOL = 'math?'
    var editor = self.textEditor;
    var selection = editor.getSelection().index;
    var htmlContent = self.textEditor.getHTML();
    setTimeout(function() {
      editor.insertText(selection, MATH_SYMBOL);
      editor.setSelection(selection, MATH_SYMBOL.length, 'silent');
      self.textEditor.once('text-change', function(delta, oldContent, source){
        if (source === 'user'){
          var changeObject = (delta.ops[1] ? delta.ops[1] : delta.ops[0]);
          if (changeObject.insert){
            var keyPress = changeObject.insert;
            if (keyPress === '\t' || keyPress === '\n'){
              self.textEditor.setHTML(htmlContent);
              editor.deleteText(selection - PREMATH_LENGTH, PREMATH_LENGTH, 'silent')
              var newId = 'math-element-' + self._mathId;
              self._mathId++;
              editor.insertHtml('<span class="ql-formula '+ newId +'" contenteditable="false"> </span>', selection - PREMATH_LENGTH);
              var $newMath = self.$editorBody.find('.' + newId).first();
              self.mathReviewer.show($newMath.position(), applyMath($newMath), afterMath($newMath, selection - PREMATH_LENGTH));
            }
          }
        }
      });
    }, 0)
  }

  function handlePreCode(){
    var selection = self.textEditor.getSelection();
    var bound = self.textEditor.getBounds(selection.index);
    self.autoComplete.showAuto("", {top: bound.bottom, left: bound.left}, ['code?']);
    self.state.changeState('CODE-AUTOCOMPLETE');
  }
  function generateCodeBlock(){
    self.state.changeState('CODE')
    var index = self.textEditor.getSelection().index;
    var line = self.textEditor.getLineNumber();
    self.state.changeState('PASTINGHTML');

    var newCodeBlock = createCodeBlock();
    self.$editorBody.children().eq(line - 1).replaceWith(newCodeBlock);
    var hoverIcon = false;
    var hoverCodeBlock = false
    $(newCodeBlock).on('mouseenter', function(){
      hoverCodeBlock = true;
      self.$closeCodeIcon.show();
      self.$closeCodeIcon.css('top', $(this).position().top);
      self.$closeCodeIcon.css('left', $(this).width() + $(this).position().left);
      self.$closeCodeIcon.off().on('click', function(){
        $(newCodeBlock).replaceWith("<p>''</p>");
        $(this).hide();
      }).on('mouseenter', function(){
        $(this).show();
        hoverIcon = true;
      }).on('mouseleave', function(){
        hoverIcon = false;
        if (!hoverCodeBlock){
          $(this).hide();
        }
      });
    }).on('mouseleave', function(){
      if (!hoverIcon){
        self.$closeCodeIcon.hide();
        hoverCodeBlock = false;
      }
    })

    setTimeout(function(){
      self.textEditor.setSelection(index - 3);
      self.state.changeState('CODE');
    }, 0)
  }

  function createCodeBlock(){
    var newCodeBlock = document.createElement('pre');
    newCodeBlock.setAttribute('class', 'ql-syntax hljs');
    newCodeBlock.setAttribute('spellcheck', 'false');
    return newCodeBlock
  }

  function handleInsertCode(){

  }

  function handleDeleteCode(deletedCode, oldContent){
    // var codeBlock = self.textEditor.getCodeBlock();
    // console.log(codeBlock);
    // if ($(codeBlock).text() === '\n'){
    //   if (self.state.state === 'CODE'){
    //     self.state.changeState('PASTINGHTML');
    //     self.textEditor.setHTML(self.state.lastHtml);
    //     self.state.changeState('CODEREMOVE');
    //   }
    //   else if ( self.state.state === 'CODEREMOVE'){
    //     self.state.changeState('PASTINGHTML');
    //     self.textEditor.setHTML(self.state.lastHtml);
    //     $(codeBlock).replaceWith('<p><br></p>');
    //     setTimeout(function(){
    //       self.textEditor.setSelection(self.state.lastIndex);
    //       self.state.changeState('TEXT');
    //     }, 0)
    //   }
    // }
    // else{
    //   self.state.changeState('CODE')
    // }

  }
  function determineState(){
    var selection = self.textEditor.getSelection();
    var lineInfo = self.textEditor.getIndex(selection.index);
    var structure = self.textEditor.getLinesStructure();
    /// if in a pre tag -> code
    if (structure[lineInfo.line - 1] === 'CODE'){
      return 'CODE'
    }
    else{
      if (selection.length == 0){
        var index = selection.index;
        if (index > 0){
          if (index >= 2 && self.textEditor.getTextAtIndex(index-1) === '$' && self.textEditor.getTextAtIndex(index-2) === '$'){
            return 'PREMATH'
          }
          else if (index >= 3 && self.textEditor.getTextAtIndex(index-1) === "'"
                                  && self.textEditor.getTextAtIndex(index-2) === "'"
                                    && self.textEditor.getTextAtIndex(index-3) === "'"){
            return 'PRECODE'
          }else{
            return 'TEXT'
          }
        }
        else{
          return 'TEXT'
        }
      }
      else{
        return 'TEXT';
      }
    }
  }

  function finishedTyping(){
    self.updateToServer({update_data: {html: self.textEditor.getHTML()}})
  }


  function handleEditor(){
    var typingTimer;
    var typingInterval = 1000;
    var reachMath = false;
    var reachCode = 0;
    self.textEditor.on('text-change', function(delta, oldContent, source){
      //self.autoComplete.specificEl = self.$editorBody.children()[self.textEditor.getIndex(self.textEditor.getSelection().index).line - 1]
      clearTimeout(typingTimer);
      typingTimer = setTimeout(finishedTyping, typingInterval);
      if (source === 'user'){
        var changeObject = (delta.ops[1] ? delta.ops[1] : delta.ops[0]);
        if (changeObject.insert){

          var keyPress = changeObject.insert;
          if (keyPress === '\n'){
            handleNewLine();
          }
          else if(keyPress === '$'){
            if (reachMath){
              handleTypingMath();
              reachMath = false;
            }
            else{
              reachMath = true;
            }
          }
          else if(keyPress === "'"){
            if (reachCode >= 2){
              handleTypingCode();
              reachCode = 0;
            }
            else{
              reachCode++;
            }
          }
          else{
            reachCode = 0;
            reachMath = false;
          }
        }
        else{
          reachCode = 0;
          reachMath = false;
        }
      }
    });

    function handleNewLine(){
      var current_line = self.textEditor.getCurrentLineSelection();
      var numberOfLine = self.textEditor.getNumberOfLines();
      if (current_line !=  numberOfLine){
        if (self.textEditor.getTextAt(numberOfLine) === ''){
          self.textEditor.deleteEmptyLine(numberOfLine);
        }
      }
    }

    function finishedTyping(){
      self.updateToServer({update_data: {html: self.textEditor.getHTML()}})
    }


    //////////////////// handle code typing/////////////////////////////
    function handleTypingCode(){

      var line = self.textEditor.getIndex().line;
      self.$editorBody.children().eq(line - 1).replaceWith('<pre class="ql-syntax" spellcheck="false"></pre>');
      self.$editorBody.find('pre').each(function(i, block) {
        hljs.highlightBlock(block);
      });
      setTimeout(function(){
        self.textEditor.setSelection(0);
      }, 0)
    }

    //////////////////// handle math typing/////////////////////////////

  }

}


TextBlocks.prototype.updateToServer = function(data){
  var self = this;
  $.ajax({
    url: window.location.pathname + '/slides/1/textblocks/' + self.id,
    type: 'PUT',
    dataType: 'json',
    data: data,
    success: function(data){
      console.log(data);
    }
  })
}

TextBlocks.prototype.applyCss = function(css){
  var css = css || this.css;
  this.$block.css('top', css.top);
  this.$block.css('left', css.left);
  this.$block.css('width', css.width);
  this.$body.css('background-color', css.background);
  this.$body.css('border', css.border);
  this.$body.css('border-radius', css.border_radius);
  this.$editorBody.css('padding-bottom', css.padding_bottom);
}

TextBlocks.prototype.applyHtml = function(html){
  var html = html || this.htmlContent;
  try{
    this.textEditor.pasteHTML(0, html, 'api');
  }
  catch(err){

  }
}


function TextBlock(manager){
  var $parent = $parent;
  this.manager = manager;
  $parent.append(text_block_html_generator());
  var $block = $parent.find('.text-block-container').last();
  var $closeButton = $block.find('.close-block-icon');
  var $drag = $block.find('.text-block-cover');
  var $reviewButton = $block.find('.review-block-icon');

  // keep this
  var self = this;

  // jquery objects:
  this.$parent = $parent;
  this.$block = $block;
  this.$body = $block.find('.text-block-body');
  this.$review = $block.find('.text-block-body-mirror');
  this.$toolbar = $block.find('.textblock-toolbar');

  // editor and add id :
  this.id = manager.provideID();
  var $basicToolBar = Utility.createQuillToolbar(this.id);
  this.textEditor = new Quill(this.$body.get(0));
  this.textEditor.addModule('toolbar',{
    container: '#' + $basicToolBar.attr('id')
  });
  x = this;
  this.$editorBody = $block.find('.ql-editor');
  this.textEditor.$editorBody = this.$editorBody;
  this.$body.attr('id', 'text-block-body-' + this.id);
  this.$review.attr('id', 'text-block-mirror-' + this.id);

  // buttons:
  this.$closeBtn = $block.find('.close-block-icon');
  this.$reviewBtn = $block.find('.review-block-icon');
  this.$dragg = $block.find('.text-block-drag');
  this.$copyPaste = $block.find('.copy-paste-icon');
  this.$addImage = $block.find('.add-image-icon');
  this.$cover = $block.find('.text-block-cover');

  // hidden area:
  this.$hiddenArea = $block.find('.text-block-hidden-area');

  // add this to its manager
  manager.addBlock(this);

  // create image manager:
  this.imageManager = new BlockImageManager();
  this.mathReviewer = new MathBlock(this.$block)
  this.mathReviewer.hide();
  var hiddenAreaToggle = Utility.toggleGenerator(function(){
    self.$hiddenArea.removeClass('hidden');
    $block.draggabilly('enable');
  }, function(){
    if (!self.$hiddenArea.hasClass('hidden')){
      self.$hiddenArea.addClass('hidden');
    }
    $block.draggabilly('disable');
  });


  //html of text block type
  function text_block_html_generator(){
    var html = '<div class="text-block-container">'
    html +=     '<div class="textblock-toolbar">'
    html +=       '<div class="close-block-icon"><i class="fa fa-close"></i></div>'
    html +=       '<div class="review-block-icon"><i class="fa fa-refresh fa-pulse fa-1x fa-fw"></i></div>'
    html +=       '<div class="copy-paste-icon"><i class="fa fa-copy"></i></div>'
    html +=       '<div class="add-image-icon"><i class="fa fa-picture-o"></i></div>'
    html +=       '<div class="text-block-drag"></div>'
    html +=     '</div>'
    html +=     '<div class="text-block-body">'
    html +=     '</div>'
    html +=     '<div class="text-block-body-mirror ql-container"></div>'
    html +=     '<div class="text-block-cover"></div>'
    html +=   '</div>'
    return html;
  }

  function clickHandler(){
    self.$editorBody.on('click', function(e){
      manager.activate(self);
      e.stopPropagation();
    })
  }
  clickHandler();
  //----------copy paste handler------------
  function copyHandler(){
    self.$copyPaste.on('click', function(){
      var newBlock = self.copyPaste();
    });
  }

  copyHandler();

  // button show/hide on hover
  function showHideButtons(){
    $block.on('mouseenter', function(){
      self.$toolbar.show();
    }).on('mouseleave', function(){
      self.$toolbar.hide();
    });
  }
  showHideButtons();

  // ------------close button handler---------------
  function intializeCloseButton(){
    $closeButton.on('click', function(e){
      $block.remove();
      manager.removeBlock(self);
      e.stopPropagation();
    });
  }
  intializeCloseButton();

  //-----------handle insert image ----------------
  function addImageToBlock(){
    self.$addImage.on('click', function(){
      self.createImageBlock();
    });

  }
  addImageToBlock();

  function resizeToFitImage(imageBlock){
    var aline_height = 18;
    var bodyHeight = self.$body.height();
    var bodyWidth = self.$body.width();
    var imageProperties = imageBlock.cssProperties();
    if (bodyWidth < imageProperties.outerWidth){
      self.$block.innerWidth(imageProperties.outerWidth + self.$body.css('padding-left').pixelToInt() * 2 + self.$body.css('border-width').pixelToInt() * 2);
    }
    if (bodyHeight < imageProperties.outerHeight){
      var diff = imageProperties.outerHeight - bodyHeight + self.$body.css('padding-top').pixelToInt() * 2 + self.$body.css('border-width').pixelToInt() * 2;
      var quotient = Math.floor(diff/aline_height);
      self.textEditor.appendEmptyLines(quotient)
    }
  }

  //------------handle text review --------------------
  function reviewTextBlock(){
    var toggle = Utility.toggleGenerator(function(){
        self.$body.hide();
        self.$review.show();
        self.$review.empty().append(self.$editorBody.html());

      },
      function(){
        self.$body.show();
        self.$review.hide();
      });

    self.$reviewBtn.on('click', function(){
      if (toggle()){
        addMathHandler();
        addCodeHandler();
        reviewImage();
      }
    });

  }
  reviewTextBlock();

  function reviewImage(){
    var group = self.imageManager.group
    var reviewManager = new BlockImageManager();
    for (var key in group){
      var aa = group[key].copyTo(self.$review, reviewManager);
    }
  }

  ////math handler

  function detectMath(){
    var mirrorChildren = self.$review.children();
    mirrorChildren.each(function(index, line){
      var text = $(line).text();
      if (/\$\$.+\$\$/.test(text)){
        $(line).addClass('math');
        $('.math-block-container').hide();
      }
    });
  }
  function addMathHandler(){
    //detectMath()
    //toMathBlock();
    //toMathLine();
    self.$review.find('.math').each(function(index, el){
      $(el).text($(el).attr('math-data'));
      MQ.StaticMath(el);
    })
  }
  /*

  function toMathBlock(){
    var mirrorChildren = self.$review.children();
    var mathLines = self.textEditor.matchMultilines(/math{/,/}math/);
    //for each math block -> add class math
    for (var i = 0; i < mathLines.length; i++){
      var currentMatch = mathLines[i];
      var start = currentMatch[0];
      var end = currentMatch[1];
      //for each line add class -> add br/ to separate the line.
      for (var j = start + 1 ; j < end; j++){
        mirrorChildren.eq(j-1).html(self.textEditor.getTextAt(j)).addClass('math').after("<br/>");
      }
      mirrorChildren.eq(start -1).remove();
      mirrorChildren.eq(end -1).remove();
    }
  }

  function toMathLine(){
    var $mirrorLines = self.$review.children();
    var mathRegex  = /@math{.+}@math/;
    var startMath = '@math{';
    var endMath = '}@math'
    var matchedResult = self.textEditor.matchLine(function(line){
      if (mathRegex.test(line)){
        return cross_list(line.indexesOf(startMath),line.indexesOf(endMath))
      }
    });
    //result should be in form of [[1, [2 , 10]], ...] -> where 1 is line number, 2 is index of @math{, and 10 is index of }@math
    if (matchedResult){
      for (var i = 0; i < matchedResult.length; i++){
        var match = matchedResult[i];
        var line = match[0];
        var lineHtml = $mirrorLines.eq(line - 1).html();
        lineHtml = lineHtml.replace(/@math{/g, "<br/><div class='math' style='width: 100%; text-align: center; margin: 2px'>");
        lineHtml = lineHtml.replace(/}@math/g, "</div>");
        $mirrorLines.eq(line - 1).html(lineHtml);
      }
    }
  }
  */



  function addCodeHandler(){
    toCodeline();
    toCodeBlock();
  }

  function toCodeline(){
    var $mirrorLines = self.$review.children();
    var matchedResult = self.textEditor.matchInlineCode();
    for (var i = 0; i < matchedResult.length; i++){
      var match = matchedResult[i];
      var language = Object.keys(match)[0];
      var line = match[language];
      var lineHtml = $mirrorLines.eq(line - 1).html();
      lineHtml = lineHtml.replace(new RegExp('@' + language + '{', 'g'), "<span class='" + language + " inline-code'>");
      lineHtml = lineHtml.replace(new RegExp('}@' + language, 'g'), "</span>");
      $mirrorLines.eq(line - 1).html(lineHtml);
      self.$review.find('.'+ language).each(function(i, block){
        hljs.highlightBlock(block)
      });
    }
    self.$review.find('.inline-code').removeAttr('class');
  }

  function toCodeBlock(){
    var codeLines = self.textEditor.matchMultilinesCode();
    var mirrorChildren = self.$review.children();
    for (var i = 0; i < codeLines.length; i++){ // for each code block, add class : language name, remove the indicators
      var currentMatch = codeLines[i];
      var languageName = Object.keys(codeLines[i])[0];
      var start = currentMatch[languageName][0];
      var end = currentMatch[languageName][1];

      //add all code to the first line
      var accumulator = "<pre><code class='" + languageName + "'>";
      for (var j = start + 1 ; j < end; j++){ // add languages name
        accumulator += self.textEditor.getTextAt(j).replace(/\t/, "  ") + '\n';
      }
      mirrorChildren.eq(start).html(accumulator + "</code></pre>");
      //remove the rest
      for (var j = end - 1; j >= start -1; j--){
        if (j != start){
          mirrorChildren.eq(j).remove();
        }
      }
      self.$review.find('.'+languageName).each(function(i, block){
        hljs.highlightBlock(block)
      });
    }
  }

  var reachMath = false;
  var $mathElement = null;
  // ----------------check on typing -> expanding text block--------
  function textEditorHandler(){
    // handle resize
    self.textEditor.on('text-change', function(delta, source){
      if (source == 'user'){
        var changeObj = (delta.ops[1] ? delta.ops[1] : delta.ops[0]);
        if (changeObj.delete){
          if (reachMath){
            self.mathReviewer.show(adjustMathElement, backtoTextBlock, $mathElement.attr('math-data'));
            reachMath = false;

            function adjustMathElement(height, width, mathCode){
              //newTree[2](mathCode);
              $mathElement.attr('math-data', mathCode);
              $mathElement.text(mathCode);
              MQ.StaticMath($mathElement.get(0));
            }

            function backtoTextBlock(){
              var selection = self.textEditor.positionOfMath($mathElement.attr('id')).end;
              console.log(selection);
              self.textEditor.getSelection();
              self.textEditor.setSelection(selection , selection , 'user');
              self.textEditor.insertText(selection, " ");
            }
          }
          else{
            var currentNode = document.getSelection().anchorNode;
            var ancestry = $.merge($(currentNode), $(currentNode).parentsUntil('div'));
            for (var i = 0; i < ancestry.length; i++){
              if (ancestry[i].previousSibling){
                if (ancestry[i].previousSibling.getAttribute('class').indexOf('math') !== -1){
                  $mathElement = $(ancestry[i].previousSibling);
                  if (ancestry[i].textContent.length == 1){
                    reachMath = true;
                    break;
                  }
                }
              }
            }
          }
        }
        else{
          reachMath = false;
        }
        var keyPress = changeObj.insert
        // handle remove empty lines
        if (keyPress === '\n') {//if new key press is \n : enter
          var current_line = this.getCurrentLineSelection();
          var numberOfLine = this.getNumberOfLines();
          if (current_line !=  numberOfLine){
            if (this.getTextAt(numberOfLine) == ''){
              this.deleteLine(numberOfLine);
            }
          }
        }
        handleBlockExpansion();
      }
    });

    //handle math
    var isMath = false;
    var currentSelection;
    var editorTextchange = self.textEditor._events['text-change'];
    var editorSelectionChange = self.textEditor._events['selection-change'];

    function checkInput(text){
      if (text == '$'){
        if (isMath){
          isMath = false;
          return '$$';
        }
        isMath = true;
        return false;
      }
      else{
        isMath = false;
        return false;
      }
    }
    function startMath(position){
      self.textEditor.createMathInLine(position);
    }
    function always(){
      editorTextchange.pop();
      editorSelectionChange.pop();
    }
    function cancelMath(){
      self.textEditor.deleteText(currentSelection, currentSelection + 2);
    }

    self.textEditor.on('text-change', function(delta, source){
      if (source == 'user'){
        var changeObject = (delta.ops[1] ? delta.ops[1] : delta.ops[0]);
        if (changeObject.insert){
          var keyPress = changeObject.insert;
          var mathRet = checkInput(keyPress);
          if (mathRet){
            currentSelection = this.getSelection().start;
            this.insertText(currentSelection, mathRet);
            this.setSelection(currentSelection, currentSelection + mathRet.length);

            //detect what next after generate placeholder for math
            this.on('selection-change', function(range){
              always();
              if (range.start == range.end && range.start == currentSelection){
                this.deleteText(currentSelection -2, 3);
                startMath(currentSelection - 1);
              }
              else{
                cancelMath()
              }
            });
            this.on('text-change', function(delta, source){
              if (source == 'user'){
                var changeObject = (delta.ops[1] ? delta.ops[1] : delta.ops[0]);
                always();
                if (changeObject.insert){
                  if (changeObject.insert == '\t'){
                    var selection = this.getSelection().start;
                    this.replaceText(currentSelection - 2, currentSelection+ 1, '||');
                    startMath(currentSelection - 1);
                  }
                  else{
                    cancelMath();
                  }
                }
              }
            });
          }
        }
      }
    });
    //var mathManager = new TextEditorHandler(self.textEditor, self.$block, self.id);
  }


  textEditorHandler();

  this.textEditor.createMathInLine = function(position){
    var currentPosition = position || this.getSelection().start;
    var newMathId = generateMathId();
    this.insertHtml(' <span id="'+ newMathId +'" class="math" math-data="" contenteditable="false">|</span> ', position);
    var $newMathEl = self.$editorBody.find('#' + newMathId);
    self.mathReviewer.show(adjustMathElement, backtoTextBlock);
    var newTree = mathTreeJson(newMathId);
    Tree.tree.create_node(self.id, newTree[0], false, newTree[1]);
    $newMathEl.click(function(){
      self.mathReviewer.show(adjustMathElement, backtoTextBlock, $(this).attr('math-data'));
    });
    function adjustMathElement(height, width, mathCode){
      newTree[2](mathCode);
      $newMathEl.attr('math-data', mathCode);
      $newMathEl.text(mathCode);
      MQ.StaticMath($newMathEl.get(0));
    }

    function backtoTextBlock(){
      var selection = position + $newMathEl.text().length + 2;
      self.textEditor.getSelection();
      self.textEditor.setSelection(selection, selection, 'user');
    }

  }


  function mathTreeJson(id){
    var treeId = 'math-block-tree-' + id;
    var action = function(){
      $(document).on('click', '#' + treeId, function(e){
        e.stopPropagation();
        //$(this).focus();
      });
    }

    function updateMath(mathCode){
      $('#' + treeId).text(mathCode);
    }

    return [{
      id          : 'tree' + id,
      text        : '<span id="' + treeId + '" contenteditable="true" style="z-index: 1000"> Math block-' + id + '</span>',
      icon        : 'fa fa-header',
      state       : {
        opened    : true,
        disabled  : false,
        selected  : false
      },
      children    : [],
      li_attr     : {},
      a_attr      : {}
    }, action, updateMath]
  }

  function generateMathId(){
    return 'math' + Math.floor((Math.random() * 10000) + 1);
  }
  /*
  this.textEditor.createMathLine = function(params, callback){
    var thiss = this;
    var currentLine = params.lineNumber || this.getCurrentLineSelection();
    if (typeof params.start != 'undefined' && typeof params.end != 'undefined'){
      this.replaceText(params.start, params.end, 'Math');
      this.setSelection(params.start, params.start);
    }
    else{
      this.addLineAndSetText(currentLine, 'Math');
      currentLine += 1;
      this.setSelection(this.getSelection().start - 4, this.getSelection().start - 4);
    }

    var currentSelection = this.getSelection().start;
    var mathLine = self.mathManager.createNewMath(self.$block, getBounds(currentLine - 1), removeMathBlock, adjustSize, newLineMath);
    // helper functions:

    function adjustSize(height, width){
      thiss.formatText(currentSelection, currentSelection + 4, 'size', height);
    }

    function removeMathBlock(){
      thiss.replaceText(currentSelection, currentSelection + 4, '');
      thiss.setSelection(currentSelection, currentSelection);
      if (callback){
        callback();
      }
      else{
        thiss.focus();
      }
    }

    function newLineMath(backFunc){
      thiss.createMathLine({lineNumber: currentLine}, function(){
        mathLine.focus();
      });
    }

  }

  */

  function setMathClass(lineNumber){
    self.$editorBody.children().eq(lineNumber).addClass('mathLine')
  }

  function getBounds(lineNumber){
    var bounds = self.$editorBody.children().eq(lineNumber).position();
    bounds['height'] = self.$editorBody.children().eq(lineNumber).height();
    return bounds;
  }

  function handleBlockExpansion(){
    var position_top = $block.position().top;
    var outer_height = $block.outerHeight();
    var position_bottom = position_top + outer_height;
    var slide_body_height = $parent.innerHeight();

    // cover the case where textblock is bigger than slide body
    if (position_bottom > slide_body_height){
      // 500 is the max height , if not exceeds the max size -> expand
      if (slide_body_height < 500 && (slide_body_height + 20) < 500 ){
        $parent.height($parent.height() + 20) //-> 20 is not correct , need to have more experience on this
        if ($parent.height() > 500){
          $parent.height(500);
        }
      }
      else{
        //if there is space above  -> move up
        if (position_top > 0 && (position_top - 20) > 0){
          $block.css('top', position_top - 20)
        }
        // else
        else{
          var selection = self.textEditor.getSelection();
          self.textEditor.deleteText(selection.start - 1, selection.end)
        }
      }
    }
  }

  // ---------------handle dragging ---------------s

  function handleBlockDragging(){
    $block.draggabilly({ //use draggabilly because jquery ui draggable has bug
      handle: '.text-block-drag',
      containment: '#' + $parent.attr('id'),
    }).on('dragMove', function(){
      self.$toolbar.show();
    }).css('position', 'absolute'); // fixed position of block after apply plugin
  }
  handleBlockDragging();


  //------------handle resizing -----------------
  function handleBlockResizing(){
    var original_height = 0;
    var aline_height = 18;
    var $blocks;
    var min_shrinkable_position;
    var padding_bottom;
    var border_size;
    var minHeight = 0;
    $block.resizable({
      minWidth: 120,
      minHeight: 40,
      containment: '#' + $parent.attr('id'),
      start: function(event, ui){
        original_height = ui.size.height;
        $blocks = $(this).find('.image-block-container');
        min_shrinkable_position = max_height_width($blocks);
        padding_bottom = self.$body.css('padding-bottom').pixelToInt();
        var minImageHeight = min_shrinkable_position[1] + self.$body.css('border-width').pixelToInt() * 2 + 12;
        var minTextHeight = original_height;
        if (padding_bottom > 12){
          minTextHeight = minTextHeight - padding_bottom + 12;
        }
        var numberOfLine = self.textEditor.getNumberOfLines();
        while (numberOfLine > 0 && self.textEditor.getTextAt(numberOfLine) == ''){
          numberOfLine--;
          minTextHeight -= 18;
        }
        minHeight = Utility.max(minTextHeight, minImageHeight);
      },
      resize: function(event, ui){
        //prevent shrinking 2 times border-with to cover left side
        var widthExtention = self.$body.css('padding-left').pixelToInt() + self.$body.css('border-width').pixelToInt() * 2;
        var width = ui.size.width - widthExtention;
        if (width <= min_shrinkable_position[0]){
          $(this).css('width', min_shrinkable_position[0] + widthExtention);
        }

        if (ui.size.height <= minHeight){
          $(this).css('height', minHeight);
        }
      },
      stop: function(event, ui){
        //need to remove height
        if (ui.size.height > original_height){ // while enlarging the block -> find diff and add new lines.
          var diff = ui.size.height - original_height;
          var quotient = Math.floor(diff/aline_height);
          var added_padding = diff - quotient * aline_height;
          var appending_html = "";
          for (i = 0; i < quotient; i++){
            appending_html += '<div><br></div>';
          }
          self.$editorBody.append(appending_html)
          self.$body.css('padding-bottom', padding_bottom + added_padding);
        }
        else if (ui.size.height < original_height){
          var diff = original_height - self.$body.css('height').pixelToInt();
          var quotient = Math.floor(diff/aline_height);
          var remaining = diff - quotient * aline_height;
          if ((padding_bottom - remaining) < 12){
            quotient += 1;
            padding_bottom = padding_bottom + aline_height - remaining;
          }
          else{
            padding_bottom -= remaining;
          }
          for (i = 0; i < quotient; i++){
            self.textEditor.deleteLine(self.textEditor.getNumberOfLines())
          }
          self.$body.css('padding-bottom', padding_bottom);
        }

        this.style.removeProperty('height');
      }
    });

  }
  handleBlockResizing();

  this.createImageBlock = function(){
    var newImageBlock = new ImageBlock(this.$body, this.imageManager);
    // differentiate from slide image block
    newImageBlock.addClass('text-block-image');
    resizeToFitImage(newImageBlock);
    var imageTree = newImageBlock.getTreeJson();
    Tree.tree.create_node(self.id, imageTree[0], false, imageTree[1]);
    return newImageBlock;
  }

}



TextBlock.prototype.copyPaste = function(){
  var copiedBlock = this.manager.slide.createTextBlock();
  copiedBlock.$editorBody.html(this.$editorBody.html());
  copiedBlock.applyCss(this.extractGeneralCss());
  // get images of current block:
  var images = this.imageManager.group;
  for (var imageId in images){
    images[imageId].copyTo(copiedBlock);
  }
  return copiedBlock;
}

TextBlock.prototype.applyCss = function(cssObject){
  this.$block.css('top', cssObject.position.top);
  this.$block.css('left', cssObject.position.left);
  this.$body.css('border', cssObject.border);
  this.$body.css('border-radius', cssObject.borderRadius);
  this.$body.css('backgroundColor', cssObject.backgroundColor);
  this.$block.outerWidth(cssObject.outerWidth);
}




TextBlock.prototype.extractGeneralCss = function(){
  var object = new Object();
  object = new Object();
  object.position = this.$block.position();
  object.innerHeight = this.$body.innerHeight();
  object.outerHeight = this.$block.outerHeight();
  object.innerWidth = this.$body.innerWidth();
  object.outerWidth = this.$block.outerWidth();
  object.backgroundColor = this.$body.css('background-color');
  object.border = this.$body.css('border');
  object.borderRadius = this.$body.css('border-radius');
  object.padding = this.$body.css('padding');
  return object;
}

TextBlock.prototype.getTreeJson = function(){
  var self = this;
  var treeId = 'text-block-tree-' + this.id;
  var action = function(){
    $(document).on('mouseenter', '#' + treeId, function(){
      self.$cover.show();
    }).on('mouseleave','#' + treeId, function(){
      self.$cover.hide()
    });
  }
  return [{
    id          : this.id,
    text        : '<span id="' + treeId + '"> text block-' + this.id + '</span>',
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
