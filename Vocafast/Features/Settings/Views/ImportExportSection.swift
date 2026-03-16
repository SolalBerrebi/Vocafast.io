import SwiftUI
import UniformTypeIdentifiers

struct ImportExportSection: View {
    @ObservedObject var viewModel: SettingsViewModel
    @EnvironmentObject var appState: AppState

    var body: some View {
        Section(L("settings_import_export")) {
            Button {
                viewModel.showImportPicker = true
            } label: {
                Label(L("settings_import_deck"), systemImage: "square.and.arrow.down")
            }

            if let result = viewModel.importResult {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(LF("settings_imported", result.wordCount, result.deckName))
                            .font(.subheadline)
                    }
                    if result.capped {
                        Text(LF("settings_capped", result.totalInFile))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            HStack {
                Image(systemName: "info.circle")
                    .foregroundStyle(.secondary)
                Text(L("settings_export_hint"))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .fileImporter(
            isPresented: $viewModel.showImportPicker,
            allowedContentTypes: [
                UTType.commaSeparatedText,
                UTType.tabSeparatedText,
                UTType.json,
                UTType.plainText,
            ],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                guard url.startAccessingSecurityScopedResource() else { return }
                defer { url.stopAccessingSecurityScopedResource() }
                if let data = try? Data(contentsOf: url) {
                    Task {
                        await viewModel.importFile(data: data, fileName: url.lastPathComponent, appState: appState)
                    }
                }
            case .failure(let error):
                viewModel.errorMessage = error.localizedDescription
            }
        }
    }
}
