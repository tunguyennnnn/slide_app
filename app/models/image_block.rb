class ImageBlock < ActiveRecord::Base
  belongs_to :slides, polymorphic: true
  belongs_to :text_blocks, polymorphic: true
end
