var x;
function TextBlocks(textblockObject, slide){
  // initialize:
  var self = this;
  this.id = textblockObject.id;
  this.css = JSON.parse(textblockObject.text_block_css);
  this.htmlContent = textblockObject.html_content;
  $('#slide-body').append(text_block_html_generator(this.id));
  this.$block = $('#text-block-container-' + this.id);
  this.$closeButton = this.$block.find('.close-block-icon');
  this.$drag = this.$block.find('.text-block-cover');
  this.$reviewButton = this.$block.find('.review-block-icon');
  this.$body = this.$block.find('.text-block-body');
  this.$review = this.$block.find('.text-block-body-mirror');
  this.$toolbar = this.$block.find('.textblock-toolbar');
  this.textEditor = new Quill(this.$body.get(0));
  x = self;
  this.$editorBody = this.$block.find('.ql-editor').first();
  this.textEditor.$editorBody = this.$editorBody;
  this.applyCss();
  this.applyHtml();

  // initialize quill


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
          console.log(data);
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
        for (var i = self.textEditor.getLength(); i > 0; i--){
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
          diff = originalHeight - ui.size.height;
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
  this.$editorBody.html(html);
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
