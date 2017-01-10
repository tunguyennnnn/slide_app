class ProjectsController < ApplicationController
  def show
    @project = Project.find(params[:id])
    @project_json = @project.as_json(
      only: [:name, :id],
      include: {
        slides: {
          methods: [:css, :update_url],
          only: [:id, :position],
          include: {
            text_blocks: {
              only: [:id, :block_css, :html_content],
              include: {
                image_blocks: {
                  only: [:id, :image_block_css, :image_url]
                }
              }
            },
            image_blocks: {
              only: [:id, :image_block_css, :image_url]
            },
            code_blocks: {
              only: [:id, :block_css, :html_content]
            }
          }
        }
      }
    )
  end

  def index
  end
end
