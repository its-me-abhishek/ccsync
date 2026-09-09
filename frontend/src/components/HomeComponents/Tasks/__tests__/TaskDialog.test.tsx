import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { TaskDialog } from '../TaskDialog';
import { Task, EditTaskState } from '../../../utils/types';

jest.mock('react-copy-to-clipboard', () => ({
  __esModule: true,
  default: ({ children, onCopy }: any) => (
    <div onClick={onCopy}>{children}</div>
  ),
}));

describe('TaskDialog Component', () => {
  const mockTask: Task = {
    id: 1,
    modified: '',
    email: '',
    uuid: 'test-uuid-123',
    description: 'Test Task',
    status: 'pending',
    priority: 'H',
    project: 'Test Project',
    tags: ['tag1', 'tag2'],
    due: '2024-12-31',
    start: '2024-12-01',
    end: '2024-12-31',
    wait: '2024-12-15',
    entry: '2024-11-01',
    urgency: 5.5,
    depends: [],
    recur: '',
    rtype: '',
    annotations: [],
  };

  const mockAllTasks: Task[] = [
    mockTask,
    {
      ...mockTask,
      id: 2,
      uuid: 'test-uuid-456',
      description: 'Dependency Task',
      status: 'pending',
    },
  ];

  const mockEditState: EditTaskState = {
    isEditing: false,
    editedDescription: mockTask.description,
    editedPriority: mockTask.priority,
    editedProject: mockTask.project,
    editedTags: mockTask.tags,
    editTagInput: '',
    isEditingPriority: false,
    isEditingProject: false,
    isEditingTags: false,
    isEditingDueDate: false,
    isEditingStartDate: false,
    isEditingEndDate: false,
    isEditingWaitDate: false,
    isEditingEntryDate: false,
    isEditingDepends: false,
    editedDueDate: mockTask.due || '',
    editedStartDate: mockTask.start || '',
    editedEndDate: mockTask.end || '',
    editedWaitDate: mockTask.wait || '',
    editedEntryDate: mockTask.entry || '',
    editedDepends: mockTask.depends || [],
    dependsDropdownOpen: false,
    dependsSearchTerm: '',
    isEditingRecur: false,
    editedRecur: '',
    originalRecur: '',
    isEditingAnnotations: false,
    editedAnnotations: [],
    annotationInput: '',
  };

  const defaultProps = {
    index: 0,
    task: mockTask,
    isOpen: false,
    selectedIndex: 0,
    onOpenChange: jest.fn(),
    onSelectTask: jest.fn(),
    selectedTaskUUIDs: [] as string[],
    onCheckboxChange: jest.fn(),
    editState: mockEditState,
    onUpdateState: jest.fn(),
    allTasks: mockAllTasks,
    uniqueProjects: [],
    uniqueTags: ['work', 'urgent', 'personal'],
    isCreatingNewProject: false,
    setIsCreatingNewProject: jest.fn(),
    onSaveDescription: jest.fn(),
    onSaveTags: jest.fn(),
    onSavePriority: jest.fn(),
    onSaveProject: jest.fn(),
    onSaveWaitDate: jest.fn(),
    onSaveStartDate: jest.fn(),
    onSaveEntryDate: jest.fn(),
    onSaveEndDate: jest.fn(),
    onSaveDueDate: jest.fn(),
    onSaveDepends: jest.fn(),
    onSaveRecur: jest.fn(),
    onSaveAnnotations: jest.fn(),
    onMarkComplete: jest.fn(),
    onMarkDeleted: jest.fn(),
    isOverdue: jest.fn(() => false),
    isUnsynced: false,
    isPinned: false,
    onTogglePin: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render the task row with correct data', () => {
      render(<TaskDialog {...defaultProps} />);

      expect(screen.getByText(mockTask.id.toString())).toBeInTheDocument();
      expect(screen.getByText(mockTask.description)).toBeInTheDocument();
      expect(screen.getByText(mockTask.project)).toBeInTheDocument();
    });

    test('should display overdue badge for overdue tasks', () => {
      const overdueProps = {
        ...defaultProps,
        isOverdue: jest.fn(() => true),
      };

      render(<TaskDialog {...overdueProps} />);

      const statusBadge = screen.getByText('O');
      expect(statusBadge).toBeInTheDocument();
    });

    test('should display red border when isUnsynced is true', () => {
      const unsyncedProps = {
        ...defaultProps,
        isUnsynced: true,
      };

      render(<TaskDialog {...unsyncedProps} />);

      const row = screen.getByTestId(`task-row-${mockTask.id}`);
      expect(row).toHaveClass('border-l-red-500');
    });

    test('should not display red border when isUnsynced is false', () => {
      const unsyncedProps = {
        ...defaultProps,
        isUnsynced: false,
      };

      render(<TaskDialog {...unsyncedProps} />);

      const row = screen.getByTestId(`task-row-${mockTask.id}`);
      expect(row).not.toHaveClass('border-l-red-500');
    });

    test('should display correct priority indicator', () => {
      const { container } = render(<TaskDialog {...defaultProps} />);

      const priorityIndicator = container.querySelector('.bg-red-500');
      expect(priorityIndicator).toBeInTheDocument();
    });

    test('should render dialog content when opened', async () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const titleEl = await screen.findByRole('heading', { level: 2 });

      expect(titleEl.textContent).toMatch(/Task\s*Details/i);
      expect(screen.getByText('ID:')).toBeInTheDocument();
      expect(screen.getByText('Description:')).toBeInTheDocument();
    });

    test('should not render dialog-specific content when closed', () => {
      render(<TaskDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders task id in the task row', () => {
      render(<TaskDialog {...defaultProps} />);
      expect(screen.getByText(mockTask.id.toString())).toBeInTheDocument();
    });

    test('renders project name in the task row', () => {
      render(<TaskDialog {...defaultProps} />);
      expect(screen.getByText(mockTask.project)).toBeInTheDocument();
    });
  });

  describe('Dialog Interactions', () => {
    test('should call onSelectTask when row is clicked', () => {
      render(<TaskDialog {...defaultProps} />);

      const taskRow = screen.getByText(mockTask.description).closest('tr');
      fireEvent.click(taskRow!);

      expect(defaultProps.onSelectTask).toHaveBeenCalledWith(mockTask, 0);
    });

    test('should open dialog when trigger is clicked', async () => {
      render(<TaskDialog {...defaultProps} />);

      const taskRow = screen.getByText(mockTask.description).closest('tr');
      fireEvent.click(taskRow!);

      expect(defaultProps.onSelectTask).toHaveBeenCalled();
    });

    test('should call onOpenChange when dialog state changes', () => {
      render(<TaskDialog {...defaultProps} />);

      const taskRow = screen.getByTestId(`task-row-${mockTask.id}`);
      fireEvent.click(taskRow);

      expect(defaultProps.onSelectTask).toHaveBeenCalledWith(mockTask, 0);
    });
  });

  describe('Description Editing', () => {
    test('should enable edit mode when pencil icon is clicked', async () => {
      const editingState = { ...mockEditState, isEditing: false };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const editButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.lucide-pencil'));

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditing: true,
          editedDescription: mockTask.description,
        });
      }
    });

    test('should update description when input changes', () => {
      const editingState = { ...mockEditState, isEditing: true };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const input = screen.getByDisplayValue(mockTask.description);
      fireEvent.change(input, { target: { value: 'Updated Task' } });

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        editedDescription: 'Updated Task',
      });
    });

    test('should save description when check icon is clicked', () => {
      const editingState = { ...mockEditState, isEditing: true };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveDescription).toHaveBeenCalledWith(
          mockTask,
          mockTask.description
        );
      }
    });

    test('should cancel editing when X icon is clicked', () => {
      const editingState = { ...mockEditState, isEditing: true };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const cancelButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.querySelector('.text-red-500'));

      if (cancelButtons.length > 0) {
        fireEvent.click(cancelButtons[0]);
        expect(defaultProps.onUpdateState).toHaveBeenCalled();
      }
    });
  });

  describe('Priority Editing', () => {
    test('should display current priority correctly', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText('High (H)')).toBeInTheDocument();
    });

    test('should enable priority editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const priorityRow = screen.getByText('Priority:').closest('tr');
      const editButton = priorityRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          editedPriority: mockTask.priority || 'NONE',
          isEditingPriority: true,
        });
      }
    });

    test('should save priority changes', () => {
      const editingState = {
        ...mockEditState,
        isEditingPriority: true,
        editedPriority: 'M',
      };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSavePriority).toHaveBeenCalledWith(mockTask, 'M');
      }
    });
  });

  describe('Tags Editing', () => {
    test('should display existing tags', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    test('should enable tags editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const tagsRow = screen.getByText('Tags:').closest('tr');
      const editButton = tagsRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditingTags: true,
          editedTags: mockTask.tags || [],
          editTagInput: '',
        });
      }
    });

    test('should display TagMultiSelect when editing', () => {
      const editingState = {
        ...mockEditState,
        isEditingTags: true,
        editedTags: ['tag1', 'tag2'],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      expect(screen.getByText('2 items selected')).toBeInTheDocument();
    });

    test('should show available tags in dropdown when editing', async () => {
      const editingState = {
        ...mockEditState,
        isEditingTags: true,
        editedTags: [],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const dropdownButton = screen.getByRole('button', {
        name: /select items/i,
      });
      fireEvent.click(dropdownButton);

      await waitFor(() => {
        expect(screen.getByText('work')).toBeInTheDocument();
        expect(screen.getByText('urgent')).toBeInTheDocument();
        expect(screen.getByText('personal')).toBeInTheDocument();
      });
    });

    test('should update tags when TagMultiSelect changes', async () => {
      const editingState = {
        ...mockEditState,
        isEditingTags: true,
        editedTags: [],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const dropdownButton = screen.getByRole('button', {
        name: /select items/i,
      });
      fireEvent.click(dropdownButton);

      await waitFor(() => {
        const workTag = screen.getByText('work');
        fireEvent.click(workTag);
      });

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        editedTags: ['work'],
      });
    });

    test('should save tags when check icon is clicked', () => {
      const editingState = {
        ...mockEditState,
        isEditingTags: true,
        editedTags: ['tag1', 'tag2', 'tag3'],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveTags).toHaveBeenCalledWith(mockTask, [
          'tag1',
          'tag2',
          'tag3',
        ]);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditingTags: false,
        });
      }
    });

    test('should cancel editing when X icon is clicked', () => {
      const editingState = {
        ...mockEditState,
        isEditingTags: true,
        editedTags: ['tag1', 'tag2', 'tag3'],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const cancelButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-red-500'));

      if (cancelButton) {
        fireEvent.click(cancelButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditingTags: false,
          editedTags: mockTask.tags || [],
        });
      }
    });
  });

  describe('Project Editing', () => {
    test('should display current project', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const projectCells = screen.getAllByText(mockTask.project);
      expect(projectCells.length).toBeGreaterThan(0);
    });

    test('should enable project editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const projectRow = screen.getByText('Project:').closest('tr');
      const editButton = projectRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          editedProject: mockTask.project,
          isEditingProject: true,
        });
      }
    });

    test('should save project changes', () => {
      const editingState = {
        ...mockEditState,
        isEditingProject: true,
        editedProject: 'New Project',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveProject).toHaveBeenCalledWith(
          mockTask,
          'New Project'
        );
      }
    });
  });

  describe('Dependencies Editing', () => {
    test('should display existing dependencies', () => {
      const taskWithDeps = {
        ...mockTask,
        depends: ['test-uuid-456'],
      };

      render(
        <TaskDialog {...defaultProps} task={taskWithDeps} isOpen={true} />
      );

      expect(screen.getByText('Dependency Task')).toBeInTheDocument();
    });

    test('should enable dependencies editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const dependsRow = screen.getByText('Depends:').closest('tr');
      const editButton = dependsRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditingDepends: true,
          editedDepends: mockTask.depends || [],
        });
      }
    });

    test('should open dropdown when Add Dependency button is clicked', () => {
      const editingState = {
        ...mockEditState,
        isEditingDepends: true,
        editedDepends: [],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const addButton = screen.getByText('Add Dependency');
      fireEvent.click(addButton);

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        dependsDropdownOpen: true,
      });
    });

    test('should save dependencies when check icon is clicked', () => {
      const editingState = {
        ...mockEditState,
        isEditingDepends: true,
        editedDepends: ['test-uuid-456'],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveDepends).toHaveBeenCalledWith(mockTask, [
          'test-uuid-456',
        ]);
      }
    });
  });

  describe('Date Editing', () => {
    test('should enable due date editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const dueRow = screen.getByText('Due:').closest('tr');
      const editButton = dueRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditingDueDate: true,
          editedDueDate: '2024-12-31',
        });
      }
    });

    test('should save due date changes', () => {
      const editingState = {
        ...mockEditState,
        isEditingDueDate: true,
        editedDueDate: '2024-12-31',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveDueDate).toHaveBeenCalledWith(
          mockTask,
          '2024-12-31'
        );
      }
    });

    const otherDateFields = [
      {
        label: 'Wait:',
        editingKey: 'isEditingWaitDate' as const,
        valueKey: 'editedWaitDate' as const,
        saveHandler: 'onSaveWaitDate' as const,
        initial: '2024-12-15',
        nextValue: '2025-01-10T00:00:00.000Z',
      },
      {
        label: 'Start:',
        editingKey: 'isEditingStartDate' as const,
        valueKey: 'editedStartDate' as const,
        saveHandler: 'onSaveStartDate' as const,
        initial: '2024-12-01',
        nextValue: '2025-01-02T00:00:00.000Z',
      },
      {
        label: 'End:',
        editingKey: 'isEditingEndDate' as const,
        valueKey: 'editedEndDate' as const,
        saveHandler: 'onSaveEndDate' as const,
        initial: '2024-12-31',
        nextValue: '2025-02-01T00:00:00.000Z',
      },
      {
        label: 'Entry:',
        editingKey: 'isEditingEntryDate' as const,
        valueKey: 'editedEntryDate' as const,
        saveHandler: 'onSaveEntryDate' as const,
        initial: '2024-11-01',
        nextValue: '2024-11-15T00:00:00.000Z',
      },
    ];

    test.each(otherDateFields)(
      'should enable $label date editing mode',
      ({ label, editingKey, valueKey, initial }) => {
        render(<TaskDialog {...defaultProps} isOpen={true} />);

        const row = screen.getByText(label).closest('tr') as HTMLElement;
        const editButton = within(row).getByLabelText('edit');
        fireEvent.click(editButton);

        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          [editingKey]: true,
          [valueKey]: initial,
        });
      }
    );

    test.each(otherDateFields)(
      'should save $label date changes',
      ({ label, editingKey, valueKey, saveHandler, nextValue }) => {
        const editingState = {
          ...mockEditState,
          [editingKey]: true,
          [valueKey]: nextValue,
        };

        render(
          <TaskDialog
            {...defaultProps}
            isOpen={true}
            editState={editingState}
          />
        );

        const row = screen.getByText(label).closest('tr') as HTMLElement;
        fireEvent.click(within(row).getByLabelText('save'));

        expect(defaultProps[saveHandler]).toHaveBeenCalledWith(
          mockTask,
          nextValue
        );
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          [editingKey]: false,
        });
      }
    );

    test.each(otherDateFields)(
      'should cancel $label date editing and restore the original value',
      ({ label, editingKey, valueKey, saveHandler, initial }) => {
        const editingState = {
          ...mockEditState,
          [editingKey]: true,
          [valueKey]: '2099-01-01',
        };

        render(
          <TaskDialog
            {...defaultProps}
            isOpen={true}
            editState={editingState}
          />
        );

        const row = screen.getByText(label).closest('tr') as HTMLElement;
        fireEvent.click(within(row).getByLabelText('cancel'));

        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          [valueKey]: initial,
          [editingKey]: false,
        });
        expect(defaultProps[saveHandler]).not.toHaveBeenCalled();
      }
    );

    test('should still enter wait-date edit mode when wait is empty', () => {
      const taskWithNoWait = { ...mockTask, wait: '' };
      render(
        <TaskDialog {...defaultProps} task={taskWithNoWait} isOpen={true} />
      );

      const row = screen.getByText('Wait:').closest('tr') as HTMLElement;
      fireEvent.click(within(row).getByLabelText('edit'));

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        isEditingWaitDate: true,
        editedWaitDate: '',
      });
    });
  });

  describe('Recurrence Editing', () => {
    test('should display None when the task has no recurrence', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const row = screen.getByText('Recur:').closest('tr') as HTMLElement;
      expect(within(row).getByText('None')).toBeInTheDocument();
    });

    test('should display the current recurrence value', () => {
      const recurringTask = { ...mockTask, recur: 'weekly' };
      render(
        <TaskDialog {...defaultProps} task={recurringTask} isOpen={true} />
      );

      const row = screen.getByText('Recur:').closest('tr') as HTMLElement;
      expect(within(row).getByText('weekly')).toBeInTheDocument();
    });

    test('should enable recurrence editing with none as the placeholder value', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const row = screen.getByText('Recur:').closest('tr') as HTMLElement;
      fireEvent.click(within(row).getByLabelText('edit'));

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        isEditingRecur: true,
        editedRecur: 'none',
        originalRecur: '',
      });
    });

    test('should seed originalRecur from an existing recurrence when editing starts', () => {
      const recurringTask = { ...mockTask, recur: 'monthly' };
      render(
        <TaskDialog {...defaultProps} task={recurringTask} isOpen={true} />
      );

      const row = screen.getByText('Recur:').closest('tr') as HTMLElement;
      fireEvent.click(within(row).getByLabelText('edit'));

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        isEditingRecur: true,
        editedRecur: 'monthly',
        originalRecur: 'monthly',
      });
    });

    test('should save the selected recurrence', () => {
      const editingState = {
        ...mockEditState,
        isEditingRecur: true,
        editedRecur: 'daily',
        originalRecur: '',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const row = screen.getByText('Recur:').closest('tr') as HTMLElement;
      fireEvent.click(within(row).getByLabelText('save'));

      expect(defaultProps.onSaveRecur).toHaveBeenCalledWith(mockTask, 'daily');
    });

    test('should cancel recurrence editing and restore originalRecur', () => {
      const editingState = {
        ...mockEditState,
        isEditingRecur: true,
        editedRecur: 'yearly',
        originalRecur: 'weekly',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const row = screen.getByText('Recur:').closest('tr') as HTMLElement;
      fireEvent.click(within(row).getByLabelText('cancel'));

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        isEditingRecur: false,
        editedRecur: 'weekly',
      });
      expect(defaultProps.onSaveRecur).not.toHaveBeenCalled();
    });
  });

  describe('Annotations Editing', () => {
    test('should display No Annotations when the task has none', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText('No Annotations')).toBeInTheDocument();
    });

    test('should display existing annotation descriptions', () => {
      const annotatedTask = {
        ...mockTask,
        annotations: [
          { entry: '2024-11-01T00:00:00.000Z', description: 'Follow up' },
        ],
      };

      render(
        <TaskDialog {...defaultProps} task={annotatedTask} isOpen={true} />
      );

      expect(screen.getByText('Follow up')).toBeInTheDocument();
      expect(screen.queryByText('No Annotations')).not.toBeInTheDocument();
    });

    test('should enable annotations editing with the current list', () => {
      const annotatedTask = {
        ...mockTask,
        annotations: [
          { entry: '2024-11-01T00:00:00.000Z', description: 'Follow up' },
        ],
      };

      render(
        <TaskDialog {...defaultProps} task={annotatedTask} isOpen={true} />
      );

      const row = screen.getByText('Annotations:').closest('tr') as HTMLElement;
      fireEvent.click(within(row).getByLabelText('edit'));

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        isEditingAnnotations: true,
        editedAnnotations: annotatedTask.annotations,
        annotationInput: '',
      });
    });

    test('should add a trimmed annotation when Enter is pressed', () => {
      const editingState = {
        ...mockEditState,
        isEditingAnnotations: true,
        editedAnnotations: [],
        annotationInput: '  ship it  ',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      fireEvent.keyDown(
        screen.getByPlaceholderText('Add an annotation (press enter to add)'),
        { key: 'Enter' }
      );

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith(
        expect.objectContaining({
          annotationInput: '',
          editedAnnotations: [
            expect.objectContaining({ description: 'ship it' }),
          ],
        })
      );
    });

    test('should not add an annotation when Enter is pressed on whitespace', () => {
      const editingState = {
        ...mockEditState,
        isEditingAnnotations: true,
        editedAnnotations: [],
        annotationInput: '   ',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      fireEvent.keyDown(
        screen.getByPlaceholderText('Add an annotation (press enter to add)'),
        { key: 'Enter' }
      );

      expect(defaultProps.onUpdateState).not.toHaveBeenCalled();
    });

    test('should remove an annotation from the editing list', () => {
      const annotation = {
        entry: '2024-11-01T00:00:00.000Z',
        description: 'Follow up',
      };
      const editingState = {
        ...mockEditState,
        isEditingAnnotations: true,
        editedAnnotations: [annotation],
        annotationInput: '',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      fireEvent.click(screen.getByText('✖'));

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        editedAnnotations: [],
      });
    });

    test('should save the edited annotations list', () => {
      const editedAnnotations = [
        { entry: '2024-11-01T00:00:00.000Z', description: 'Follow up' },
      ];
      const editingState = {
        ...mockEditState,
        isEditingAnnotations: true,
        editedAnnotations,
        annotationInput: '',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      fireEvent.click(screen.getByLabelText('Save annotations'));

      expect(defaultProps.onSaveAnnotations).toHaveBeenCalledWith(
        mockTask,
        editedAnnotations
      );
      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        isEditingAnnotations: false,
        annotationInput: '',
      });
    });

    test('should cancel annotation editing and restore the original list', () => {
      const original = [
        { entry: '2024-11-01T00:00:00.000Z', description: 'Keep me' },
      ];
      const taskWithNotes = { ...mockTask, annotations: original };
      const editingState = {
        ...mockEditState,
        isEditingAnnotations: true,
        editedAnnotations: [
          { entry: '2024-12-01T00:00:00.000Z', description: 'Draft' },
        ],
        annotationInput: 'unsent',
      };

      render(
        <TaskDialog
          {...defaultProps}
          task={taskWithNotes}
          isOpen={true}
          editState={editingState}
        />
      );

      fireEvent.click(screen.getByLabelText('Cancel editing annotations'));

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        isEditingAnnotations: false,
        editedAnnotations: original,
        annotationInput: '',
      });
      expect(defaultProps.onSaveAnnotations).not.toHaveBeenCalled();
    });
  });

  describe('Task Actions', () => {
    test('should display Mark As Completed button for pending tasks', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText(/Mark As Completed/)).toBeInTheDocument();
    });

    test('should not display Mark As Completed button for completed tasks', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      render(
        <TaskDialog {...defaultProps} task={completedTask} isOpen={true} />
      );

      expect(screen.queryByText(/Mark As Completed/)).not.toBeInTheDocument();
    });

    test('should display delete button for non-deleted tasks', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const deleteButton = document.getElementById(
        `mark-task-as-deleted-${mockTask.id}`
      );
      expect(deleteButton).toBeInTheDocument();
    });

    test('should call onMarkComplete when confirmed', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const markCompleteButton = screen.getByText(/Mark As Completed/);
      fireEvent.click(markCompleteButton);

      const yesButtons = screen.getAllByText('Yes');
      if (yesButtons.length > 0) {
        fireEvent.click(yesButtons[0]);
        expect(defaultProps.onMarkComplete).toHaveBeenCalledWith(mockTask.uuid);
      }
    });

    test('should call onMarkDeleted when confirmed', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const deleteButton = screen.getByRole('button', {
        name: /delete task/i,
      });
      fireEvent.click(deleteButton);

      const yesButtons = screen.getAllByText('Yes');
      if (yesButtons.length > 0) {
        fireEvent.click(yesButtons[0]);
        expect(defaultProps.onMarkDeleted).toHaveBeenCalledWith(mockTask.uuid);
      }
    });
  });

  describe('UUID Copy Functionality', () => {
    test('should display UUID in dialog', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText(mockTask.uuid)).toBeInTheDocument();
    });

    test('should have copy button for UUID', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const uuidRow = screen.getByText('UUID:').closest('tr');
      const copyButton = uuidRow?.querySelector('button');
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Selected State', () => {
    test('should highlight selected task row', () => {
      render(<TaskDialog {...defaultProps} selectedIndex={0} />);

      const taskRow = screen.getByText(mockTask.description).closest('tr');
      expect(taskRow).toHaveAttribute('data-selected', 'true');
    });

    test('should not highlight non-selected task row', () => {
      render(<TaskDialog {...defaultProps} selectedIndex={1} />);
      const taskRow = screen.getByText(mockTask.description).closest('tr');
      expect(taskRow).toHaveAttribute('data-selected', 'false');
    });
  });

  describe('Status Display', () => {
    test('should display P badge for pending tasks', () => {
      render(<TaskDialog {...defaultProps} />);

      expect(screen.getByText('P')).toBeInTheDocument();
    });

    test('should display C badge for completed tasks', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      render(<TaskDialog {...defaultProps} task={completedTask} />);

      expect(screen.getByText('C')).toBeInTheDocument();
    });

    test('should display D badge for deleted tasks', () => {
      const deletedTask = { ...mockTask, status: 'deleted' };
      render(<TaskDialog {...defaultProps} task={deletedTask} />);

      expect(screen.getByText('D')).toBeInTheDocument();
    });

    test('should display O badge for overdue pending tasks', () => {
      const overdueProps = {
        ...defaultProps,
        isOverdue: jest.fn(() => true),
      };

      render(<TaskDialog {...overdueProps} />);

      expect(screen.getByText('O')).toBeInTheDocument();
    });
  });

  describe('Pin Functionality', () => {
    test('should display pin button in dialog footer when task is not pinned', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={false} />);

      const pinButton = screen.getByRole('button', { name: /pin task/i });
      expect(pinButton).toBeInTheDocument();
      expect(screen.getByText('Pin')).toBeInTheDocument();
    });

    test('should display unpin button in dialog footer when task is pinned', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={true} />);

      const unpinButton = screen.getByRole('button', { name: /unpin task/i });
      expect(unpinButton).toBeInTheDocument();
      expect(screen.getByText('Unpin')).toBeInTheDocument();
    });

    test('should call onTogglePin when pin button is clicked', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={false} />);

      const pinButton = screen.getByRole('button', { name: /pin task/i });
      fireEvent.click(pinButton);

      expect(defaultProps.onTogglePin).toHaveBeenCalledWith(mockTask.uuid);
    });

    test('should call onTogglePin when unpin button is clicked', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={true} />);

      const unpinButton = screen.getByRole('button', { name: /unpin task/i });
      fireEvent.click(unpinButton);

      expect(defaultProps.onTogglePin).toHaveBeenCalledWith(mockTask.uuid);
    });

    test('should display pin icon in task row when task is not pinned', () => {
      const { container } = render(
        <TaskDialog {...defaultProps} isPinned={false} />
      );

      const pinIcon = container.querySelector('.lucide-pin');
      expect(pinIcon).toBeInTheDocument();
    });

    test('should display pin icon in task row when task is pinned', () => {
      const { container } = render(
        <TaskDialog {...defaultProps} isPinned={true} />
      );

      const pinIcon = container.querySelector('.lucide-pin');
      expect(pinIcon).toBeInTheDocument();
    });

    test('should call onTogglePin when pin icon in task row is clicked', () => {
      const { container } = render(
        <TaskDialog {...defaultProps} isPinned={false} />
      );

      const pinIcon = container.querySelector('.lucide-pin');
      expect(pinIcon).toBeInTheDocument();

      if (pinIcon?.parentElement) {
        fireEvent.click(pinIcon.parentElement);
        expect(defaultProps.onTogglePin).toHaveBeenCalledWith(mockTask.uuid);
      }
    });

    test('should not open dialog when pin icon in task row is clicked', () => {
      const { container } = render(
        <TaskDialog {...defaultProps} isPinned={false} />
      );

      const pinIcon = container.querySelector('.lucide-pin');

      if (pinIcon?.parentElement) {
        fireEvent.click(pinIcon.parentElement);
        expect(defaultProps.onSelectTask).not.toHaveBeenCalled();
      }
    });

    test('pin button should have mr-auto class for left alignment', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={false} />);

      const pinButton = screen.getByRole('button', { name: /pin task/i });
      expect(pinButton).toHaveClass('mr-auto');
    });
  });

  describe('Testing Shortcuts', () => {
    beforeEach(() => {
      Element.prototype.scrollIntoView = jest.fn();
    });

    test('ArrowDown moves focus to next field', async () => {
      render(<TaskDialog {...defaultProps} isOpen />);

      const dialog = await screen.findByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });

      const dueRow = screen.getByText('Due:').closest('tr');
      expect(dueRow).toHaveClass('bg-black/15');
    });

    test('Enter opens edit mode for focused field', async () => {
      const editStateWithEditingOn = {
        ...defaultProps.editState,
        isEditing: true,
        editedDescription: defaultProps.task.description,
      };

      render(
        <TaskDialog
          {...defaultProps}
          isOpen
          editState={editStateWithEditingOn}
        />
      );

      await screen.findByRole('dialog');

      const descriptionInput = screen.getByLabelText('description');
      expect(descriptionInput).toBeInTheDocument();
      expect(descriptionInput).toHaveAttribute('type', 'text');
      expect(descriptionInput).toHaveValue(defaultProps.task.description);
    });

    test('Arrow keys do not navigate while editing', () => {
      render(<TaskDialog {...defaultProps} isOpen />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter' });
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });

      const descriptionRow = screen.getByText('Description:').closest('tr');
      expect(descriptionRow).toBeInTheDocument();
    });

    test('Escape exits edit mode before closing dialog', () => {
      const editStateWithEditingOn = {
        ...defaultProps.editState,
        isEditing: true,
        editedDescription: defaultProps.task.description,
      };

      render(
        <TaskDialog
          {...defaultProps}
          isOpen
          editState={editStateWithEditingOn}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter' });

      const descriptionInput = screen.getByLabelText('description');
      expect(descriptionInput).toBeInTheDocument();

      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(dialog).toBeInTheDocument();
    });

    test('DateTimePicker is visible when any date field is in edit mode', async () => {
      const editStateWithDueDateEditing = {
        ...defaultProps.editState,
        isEditingDueDate: true,
        editedDueDate: defaultProps.task.due || '',
      };

      render(
        <TaskDialog
          {...defaultProps}
          isOpen
          editState={editStateWithDueDateEditing}
        />
      );

      await screen.findByRole('dialog');

      expect(
        await screen.findByRole('button', { name: /calender-button/i })
      ).toBeInTheDocument();
    });
  });
});
