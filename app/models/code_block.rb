class CodeBlock < ActiveRecord::Base
  after_create :add_default_html_css
  belongs_to :slides
  DEFAULT_HTML = "<pre class='ql-syntax hljs' spellcheck='false'> </pre>"
  DEFAULT_CSS = {width: "150px",
                 top: "0px", left: "0px",
                 border: "2px solid rgb(51, 51, 51)",
                 border_radius: "10px",
                 background: "white",
                }.to_json

  def add_default_html_css
    self.update(block_css: DEFAULT_CSS, html_content: DEFAULT_HTML)
  end
end
