import SwiftUI

struct StreakCalendarView: View {
    let sessionDates: Set<String>

    private let columns = 7
    private let rows = 15 // ~15 weeks
    private let cellSize: CGFloat = 14
    private let spacing: CGFloat = 3

    private var calendar: Calendar { Calendar.current }

    private var cells: [CellData] {
        let today = Date()
        let totalDays = columns * rows
        var result: [CellData] = []

        // Start from (totalDays - 1) days ago
        for i in stride(from: totalDays - 1, through: 0, by: -1) {
            guard let date = calendar.date(byAdding: .day, value: -i, to: today) else { continue }
            let dateStr = date.yyyyMMdd
            let hasActivity = sessionDates.contains(dateStr)
            result.append(CellData(date: dateStr, hasActivity: hasActivity))
        }

        return result
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHGrid(rows: Array(repeating: GridItem(.fixed(cellSize), spacing: spacing), count: columns), spacing: spacing) {
                ForEach(cells, id: \.date) { cell in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(cell.hasActivity ? Color.green : Color(.systemGray5))
                        .frame(width: cellSize, height: cellSize)
                }
            }
        }
        .frame(height: CGFloat(columns) * (cellSize + spacing))
    }
}

private struct CellData {
    let date: String
    let hasActivity: Bool
}
