const ProjectListPage = () => {
  // 추후 사업 목록 데이터 로드 예정
  const projects = []

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white">사업 리스트</h1>
      
      <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-8 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-soft-blue/30">
                <th className="pb-4 text-soft-blue font-semibold">사업명</th>
                <th className="pb-4 text-soft-blue font-semibold">시작일</th>
                <th className="pb-4 text-soft-blue font-semibold">종료일</th>
                <th className="pb-4 text-soft-blue font-semibold">생성일</th>
                <th className="pb-4 text-soft-blue font-semibold">작업</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-soft-blue/60">
                    등록된 사업이 없습니다.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b border-soft-blue/10 hover:bg-soft-blue/5 transition-colors">
                    <td className="py-4 text-white font-medium">{project.name}</td>
                    <td className="py-4 text-soft-blue">{project.start_date || '-'}</td>
                    <td className="py-4 text-soft-blue">{project.end_date || '-'}</td>
                    <td className="py-4 text-soft-blue">{project.created_at}</td>
                    <td className="py-4">
                      <button className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all text-sm font-medium mr-2">
                        수정
                      </button>
                      <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-button hover:bg-red-500/20 transition-all text-sm font-medium">
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProjectListPage
