import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchAdminSkills,
  saveSkill,
  deleteSkill,
} from '../store/slices/adminPortfolioSlice.js';
import PortfolioAdminService from '../../bll/services/PortfolioAdminService.js';
import { toCsv } from '../../bll/services/CsvService.js';
import { downloadTextFile } from '../utils/download.js';
import AdminCrudView from '../views/components/AdminCrudView.jsx';
import SkillForm from '../views/components/SkillForm.jsx';

export const SKILL_COLUMNS = [
  { key: 'title', label: 'Compétence', value: (s) => s.name },
  {
    key: 'level',
    label: 'Niveau',
    value: (s) => s.level,
    render: (s) => (
      <div className="pf-row" style={{ flexWrap: 'nowrap', gap: 10 }}>
        <div className="pf-bar" style={{ width: 120 }} aria-hidden="true">
          <i style={{ '--w': `${s.level}%` }} />
        </div>
        <span>{s.level} %</span>
      </div>
    ),
  },
  { key: 'sortOrder', label: 'Ordre', value: (s) => s.sortOrder ?? 0 },
];

class AdminSkillsController extends Component {
  state = { editing: null, deleting: null, formError: null, busy: false };

  componentDidMount() {
    this.props.fetchAdminSkills();
  }

  create = () => this.setState({ editing: {}, formError: null });
  edit = (row) => this.setState({ editing: row, formError: null });
  cancelEdit = () => this.setState({ editing: null, formError: null });

  submit = async (values) => {
    const invalid = PortfolioAdminService.validateSkill(values);
    if (invalid) return this.setState({ formError: invalid });
    const { editing } = this.state;
    this.setState({ busy: true, formError: null });
    try {
      const dto = PortfolioAdminService.toSkillDto(values);
      await this.props.saveSkill({ id: (editing && editing.id) || null, dto }).unwrap();
      this.setState({ editing: null, busy: false });
    } catch (err) {
      this.setState({ formError: err.message, busy: false });
    }
  };

  askDelete = (row) => this.setState({ deleting: row });
  cancelDelete = () => this.setState({ deleting: null });
  confirmDelete = async () => {
    const { deleting } = this.state;
    this.setState({ deleting: null });
    await this.props.deleteSkill(deleting.id);
  };

  exportCsv = (rows) =>
    downloadTextFile(
      'competences.csv',
      toCsv(
        rows,
        SKILL_COLUMNS.map((c) => ({ label: c.label, value: c.value }))
      )
    );

  renderForm = (initial) => (
    <SkillForm
      initial={initial}
      saving={this.state.busy}
      error={this.state.formError}
      onSubmit={this.submit}
      onCancel={this.cancelEdit}
    />
  );

  render() {
    // AdminCrudView affiche `title` dans les libellés d'actions et la confirmation
    const rows = this.props.items.map((s) => ({ ...s, title: s.name }));
    return (
      <AdminCrudView
        title="Compétences"
        rows={rows}
        columns={SKILL_COLUMNS}
        loading={this.props.loading}
        error={this.props.error}
        editing={this.state.editing}
        deleting={this.state.deleting}
        renderForm={this.renderForm}
        onCreate={this.create}
        onEdit={this.edit}
        onAskDelete={this.askDelete}
        onConfirmDelete={this.confirmDelete}
        onCancelDelete={this.cancelDelete}
        onCancelEdit={this.cancelEdit}
        onExport={this.exportCsv}
      />
    );
  }
}

const mapState = (s) => ({
  items: s.adminPortfolio.skills,
  loading: s.adminPortfolio.loading,
  error: s.adminPortfolio.error,
});
export default connect(mapState, { fetchAdminSkills, saveSkill, deleteSkill })(
  AdminSkillsController
);
