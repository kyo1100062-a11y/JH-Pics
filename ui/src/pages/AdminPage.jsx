const AdminPage = () => {
  // 추후 관리자 기능 구현 예정
  const pictureSets = []

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white">관리자 페이지</h1>
      
      <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-8 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-soft-blue/30">
                <th className="pb-4 text-soft-blue font-semibold">제목</th>
                <th className="pb-4 text-soft-blue font-semibold">날짜</th>
                <th className="pb-4 text-soft-blue font-semibold">사업명</th>
                <th className="pb-4 text-soft-blue font-semibold">작성자</th>
                <th className="pb-4 text-soft-blue font-semibold">작업</th>
              </tr>
            </thead>
            <tbody>
              {pictureSets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-soft-blue/60">
                    등록된 사진 세트가 없습니다.
                  </td>
                </tr>
              ) : (
                pictureSets.map((set) => (
                  <tr key={set.id} className="border-b border-soft-blue/10 hover:bg-soft-blue/5 transition-colors">
                    <td className="py-4 text-white font-medium">{set.title}</td>
                    <td className="py-4 text-soft-blue">{set.created_at}</td>
                    <td className="py-4 text-soft-blue">{set.project_name}</td>
                    <td className="py-4 text-soft-blue">{set.user_name}</td>
                    <td className="py-4">
                      <button className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all text-sm font-medium mr-2">
                        수정
                      </button>
                      <button className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-button hover:bg-red-500/20 transition-all text-sm font-medium mr-2">
                        삭제
                      </button>
                      <button className="px-3 py-1.5 bg-accent-mint/10 border border-accent-mint/30 text-accent-mint rounded-button hover:bg-accent-mint/20 hover:shadow-glow transition-all text-sm font-medium">
                        출력
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

export default AdminPage
