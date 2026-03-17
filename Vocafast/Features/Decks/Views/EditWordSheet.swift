import SwiftUI

struct EditWordSheet: View {
    let word: Word
    let onSave: (String, String, String?) -> Void
    let onDelete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var editWord: String
    @State private var editTranslation: String
    @State private var editContext: String

    init(word: Word, onSave: @escaping (String, String, String?) -> Void, onDelete: @escaping () -> Void) {
        self.word = word
        self.onSave = onSave
        self.onDelete = onDelete
        _editWord = State(initialValue: word.word)
        _editTranslation = State(initialValue: word.translation)
        _editContext = State(initialValue: word.contextSentence ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(L("edit_word_section")) {
                    TextField(L("edit_word_section"), text: $editWord)
                }

                Section(L("edit_translation_section")) {
                    TextField(L("edit_translation_section"), text: $editTranslation)
                }

                Section(L("edit_context_section")) {
                    TextField(L("edit_context_placeholder"), text: $editContext)
                }

                Section {
                    Button(L("edit_delete_word"), role: .destructive) {
                        onDelete()
                        dismiss()
                    }
                }
            }
            .navigationTitle(L("edit_title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L("common_cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L("common_save")) {
                        onSave(editWord, editTranslation, editContext.isEmpty ? nil : editContext)
                        dismiss()
                    }
                    .disabled(editWord.isEmpty || editTranslation.isEmpty)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
