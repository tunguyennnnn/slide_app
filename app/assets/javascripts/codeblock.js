var y
var CodeBlock = function(codeblockObject, slide){
  y = this;
  var self = this;
  this.slide = slide;
  this.id = codeblockObject.id;
  this.css = JSON.parse(codeblockObject.block_css);
  this.htmlContent = codeblockObject.html_content;
  slide.$slideBody.append(codeBlockHtml(this.id));
  this.$block = $('#code-block-container-' + this.id);
  this.$closeButton = this.$block.find('.close-block-icon');
  this.$drag = this.$block.find('.code-block-drag');
  this.$body = this.$block.find('.code-block-body');
  this.$toolbar = this.$block.find('.codeblock-toolbar');
  self.textEditor = new Quill(self.$body.get(0), {
    modules: {
      syntax: true
    },
  });

  this.$editorBody = this.$body.find('.ql-editor');
  this.textEditor.$editorBody = this.$editorBody;
  //init html css:
  this.applyHtml();
  this.applyCss();

  function initCodeEditor(){
    self.$codeBody = self.$editorBody.find('pre').first();
    hljs.highlightBlock(self.$codeBody.get(0));
    self.$body.css('background', self.$codeBody.css('background'));
  }
  initCodeEditor();

  function onKeyPress(){
    var typingTimer;
    var typingInterval = 1000;

    self.textEditor.on('text-change', function(delta, oldContent, source){
      clearTimeout(typingTimer);
      typingTimer = setTimeout(finishedTyping, typingInterval);
    })
  }
  onKeyPress();

  function finishedTyping(){
    self.updateToServer({update_data: {html: self.$body.html()}});
  }

  function initToolbar(){
    self.$block.on('mouseenter', function(){
      self.$toolbar.show();
    }).on('mouseleave', function(){
      self.$toolbar.hide();
    })
  }
  initToolbar();

  function initCloseCodeBlock(){
    self.$closeButton.on('click', function(e){
      var url = window.location.pathname + '/slides/1/codeblocks/' + self.id;
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
  initCloseCodeBlock();


  function initDragging(){
    self.$block.draggabilly({
      handle: '.code-block-drag',
      containment: '#slide-body',
    }).on('dragMove', function(){
      self.$toolbar.show();
    }).on('dragEnd', function(event, pointer){
      self.updateToServer({update_data: {css: {top: self.$block.css('top'), left: self.$block.css('left')}}})
    }).css('position', 'absolute');
  }
  initDragging();

  function codeBlockHtml(id){
    var html = '<div class="code-block-container" id="code-block-container-' + id + '">'
    html +=     '<div class="codeblock-toolbar">'
    html +=       '<div class="close-block-icon"><i class="fa fa-close"></i></div>'
    html +=       '<div class="code-block-drag"></div>'
    html +=     '</div>'
    html +=     '<div class="code-block-body">'
    html +=     '</div>'
    html +=     '<div class="code-block-cover"></div>'
    html +=   '</div>'
    return html;
  }
}

CodeBlock.prototype.updateToServer = function(data){
  var self = this;
  $.ajax({
    url: window.location.pathname + '/slides/1/codeblocks/' + self.id,
    type: 'PUT',
    dataType: 'json',
    data: data,
    success: function(data){
      console.log(data);
    }
  })
}


CodeBlock.prototype.applyCss = function(css){
  var css = css || this.css;
  this.$block.css('top', css.top);
  this.$block.css('left', css.left);
  this.$block.css('width', css.width);
  this.$body.css('border', css.border);
  this.$body.css('border-radius', css.border_radius);
  this.$body.css('padding-bottom', css.padding_bottom);
}

CodeBlock.prototype.applyHtml = function(html){
  var html = html || this.htmlContent;
  console.log(this.textEditor.getHTML())
  console.log(html);
  this.textEditor.pasteHTML(0, html, 'api');
  this.cleanP();
}

CodeBlock.prototype.cleanP = function(html){
  this.$editorBody.find('p').each(function(index, child){
    $(child).remove();
  })
}
